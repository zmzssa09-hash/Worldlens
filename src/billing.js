// 구독·결제 (토스페이먼츠 자동결제)
//
// 흐름
//   가입 → 무료 체험(TRIAL_DAYS일) → 카드 등록(빌링키 발급) → 체험이 끝나는 날 첫 결제 → 이후 매달 자동 결제
//   체험이 이미 끝난 뒤 카드를 등록하면 그 자리에서 바로 첫 결제
//   해지하면 지금 기간이 끝날 때까지는 계속 볼 수 있고, 다음 결제부터 멈춤
//
// 결제 방식
//   TOSS_CLIENT_KEY / TOSS_SECRET_KEY 가 있으면 → 토스 자동결제 (test_ck/test_sk면 테스트, 실제 돈 안 나감)
//   없으면 → '개발용 테스트 결제' (버튼만 누르면 구독 처리. 실제 서비스에서는 반드시 꺼야 함)
import { randomBytes } from 'node:crypto';
import { db } from './db.js';
import { getUser } from './auth.js';

export const PRICE = Number(process.env.WORLDLENS_PRICE || 4900); // 원/월
const TOSS_API = 'https://api.tosspayments.com';
const CLIENT_KEY = process.env.TOSS_CLIENT_KEY || '';
const SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
export const PROVIDER = CLIENT_KEY && SECRET_KEY ? 'toss' : 'dev';
// 개발용 결제는 키가 없고, 명시적으로 끄지 않았을 때만
export const DEV_BILLING = PROVIDER === 'dev' && process.env.WORLDLENS_DEV_BILLING !== 'off';

const nowIso = () => new Date().toISOString();
const addMonth = (iso) => { const d = new Date(iso); d.setMonth(d.getMonth() + 1); return d.toISOString(); };

// 가설·관점을 볼 수 있는지
export function hasAccess(u) {
  if (!u) return false;
  const now = nowIso();
  if (u.trial_end && now < u.trial_end) return true;
  if (u.period_end && now < u.period_end && (u.status === 'active' || u.status === 'trialing')) return true;
  return false;
}

export function publicUser(u) {
  if (!u) return null;
  const trialActive = !!u.trial_end && nowIso() < u.trial_end;
  return {
    email: u.email,
    access: hasAccess(u),
    status: u.status,
    trial_active: trialActive,
    trial_end: u.trial_end,
    period_end: u.period_end,
    has_card: !!u.billing_key,
    card_label: u.card_label,
    cancel_at_period_end: !!u.cancel_at_period_end,
    // 다음 결제 예정일 (카드가 있고 해지하지 않았을 때)
    next_charge_at: u.billing_key && !u.cancel_at_period_end ? (u.status === 'active' ? u.period_end : u.trial_end) : null,
    last_charge_error: u.last_charge_error,
  };
}

export function billingConfig() {
  return { provider: PROVIDER, dev_billing: DEV_BILLING, price: PRICE, currency: 'KRW', client_key: PROVIDER === 'toss' ? CLIENT_KEY : null };
}

// ── 토스 API ──
async function toss(path, body) {
  const res = await fetch(`${TOSS_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${SECRET_KEY}:`).toString('base64')}`, // 시크릿 키 뒤에 ':' 필수
      'Content-Type': 'application/json',
      'Idempotency-Key': body.orderId || randomBytes(16).toString('hex'), // 같은 주문이 두 번 결제되지 않게
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(65000), // 자동결제 승인은 최대 60초
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${data.code || res.status}: ${data.message || '결제 요청 실패'}`);
  return data;
}

const newOrderId = () => `wl_${Date.now()}_${randomBytes(6).toString('hex')}`; // 6~64자, 영문·숫자·-_=

function recordPayment(orderId, userId, status, extra = {}) {
  db.prepare(`INSERT INTO payments (order_id, user_id, amount, status, payment_key, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(orderId, userId, PRICE, status, extra.paymentKey ?? null, extra.message ?? null, nowIso());
}

// 한 달 치 결제. 성공하면 이용 기간을 한 달 늘림
async function chargeMonth(u) {
  const orderId = newOrderId();
  const start = u.status === 'active' && u.period_end && u.period_end > nowIso() ? u.period_end
    : u.trial_end && u.trial_end > nowIso() ? u.trial_end : nowIso();
  try {
    const p = await toss(`/v1/billing/${encodeURIComponent(u.billing_key)}`, {
      customerKey: u.customer_key, amount: PRICE, orderId, orderName: 'WorldLens 월 구독', customerEmail: u.email,
    });
    if (p.status !== 'DONE') throw new Error(`결제 상태 ${p.status}`);
    recordPayment(orderId, u.id, 'DONE', { paymentKey: p.paymentKey });
    db.prepare("UPDATE users SET status = 'active', period_end = ?, last_charge_error = NULL WHERE id = ?").run(addMonth(start), u.id);
    return { ok: true };
  } catch (e) {
    recordPayment(orderId, u.id, 'FAILED', { message: e.message });
    db.prepare("UPDATE users SET status = CASE WHEN status = 'active' THEN 'past_due' ELSE status END, last_charge_error = ? WHERE id = ?")
      .run(e.message, u.id);
    console.warn(`[결제 실패] 회원 ${u.id}: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

// 카드 등록 완료(토스 successUrl로 돌아왔을 때): 빌링키 발급 → 체험 중이면 저장만, 아니면 바로 첫 결제
export async function completeCardRegistration(userId, authKey, customerKey) {
  const u = getUser(userId);
  if (!u || u.customer_key !== customerKey) throw new Error('고객 정보가 맞지 않아요');
  const b = await toss('/v1/billing/authorizations/issue', { authKey, customerKey });
  const label = [b.card?.cardType, b.card?.number].filter(Boolean).join(' ') || null;
  db.prepare('UPDATE users SET billing_key = ?, card_label = ?, cancel_at_period_end = 0, last_charge_error = NULL WHERE id = ?')
    .run(b.billingKey, label, userId);
  const fresh = getUser(userId);
  if (fresh.trial_end && fresh.trial_end > nowIso()) return { ok: true, charged: false };
  return chargeMonth(fresh);
}

// 개발용: 카드 없이 한 달 구독 처리 (토스 키가 없을 때만)
export function devSubscribe(userId) {
  if (!DEV_BILLING) throw new Error('개발용 결제가 꺼져 있어요');
  const u = getUser(userId);
  const start = u.trial_end && u.trial_end > nowIso() ? u.trial_end : nowIso();
  const orderId = newOrderId();
  recordPayment(orderId, userId, 'DEV', { message: '개발용 테스트 결제 (실제 결제 아님)' });
  db.prepare(`UPDATE users SET status = 'active', period_end = ?, billing_key = 'DEV', card_label = '테스트 카드',
    cancel_at_period_end = 0, last_charge_error = NULL WHERE id = ?`).run(addMonth(start), userId);
}

export function setCancel(userId, cancel) {
  db.prepare('UPDATE users SET cancel_at_period_end = ? WHERE id = ?').run(cancel ? 1 : 0, userId);
}

// 정기 결제: 결제일이 지난 회원을 찾아 결제 (스케줄러가 주기적으로 호출)
// 토스는 스케줄링을 해 주지 않으므로 이 서버가 직접 돌려야 함
export async function runRenewals() {
  const now = nowIso();
  const due = db.prepare(`SELECT * FROM users WHERE billing_key IS NOT NULL AND cancel_at_period_end = 0 AND (
      (status = 'trialing' AND trial_end <= ?) OR (status IN ('active', 'past_due') AND period_end <= ?))`).all(now, now);
  let ok = 0, failed = 0;
  for (const u of due) {
    if (u.billing_key === 'DEV') { // 개발용: 결제 없이 연장
      db.prepare("UPDATE users SET status = 'active', period_end = ? WHERE id = ?").run(addMonth(now), u.id);
      ok++;
      continue;
    }
    if (PROVIDER !== 'toss') continue;
    // 같은 회원을 실패 후 너무 자주 재시도하지 않도록: 하루에 한 번
    const lastFail = db.prepare("SELECT created_at FROM payments WHERE user_id = ? AND status = 'FAILED' ORDER BY created_at DESC LIMIT 1").get(u.id);
    if (lastFail && Date.now() - Date.parse(lastFail.created_at) < 86400000) continue;
    ((await chargeMonth(u)).ok ? ok++ : failed++);
  }
  // 기간이 끝났고 다음 결제가 없는 회원은 만료 처리
  db.prepare(`UPDATE users SET status = 'expired' WHERE status IN ('trialing', 'active') AND
    (billing_key IS NULL OR cancel_at_period_end = 1) AND COALESCE(period_end, trial_end) <= ?`).run(now);
  if (ok || failed) console.log(`[정기 결제] 성공 ${ok}건, 실패 ${failed}건`);
  return { ok, failed };
}
