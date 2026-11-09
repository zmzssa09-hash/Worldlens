// 회원가입·로그인 (이메일 + 비밀번호)
// - 비밀번호는 scrypt로 해시해서 저장 (원문은 저장하지 않음)
// - 로그인 상태는 HttpOnly 쿠키의 무작위 세션 토큰으로 유지
import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { db } from './db.js';

const COOKIE = 'wl_session';
const SESSION_DAYS = 30;
export const TRIAL_DAYS = Number(process.env.WORLDLENS_TRIAL_DAYS || 7);

export function hashPassword(pw) {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}
function verifyPassword(pw, stored) {
  const [, s, h] = String(stored).split('$');
  if (!s || !h) return false;
  const expected = Buffer.from(h, 'base64');
  const actual = scryptSync(pw, Buffer.from(s, 'base64'), expected.length);
  return timingSafeEqual(expected, actual);
}
// 세션 토큰은 DB에 해시로만 저장 (DB가 새도 토큰을 그대로 쓸 수 없게)
const tokenHash = (t) => createHash('sha256').update(t).digest('hex');

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function validEmail(email) {
  return typeof email === 'string' && email.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function validPassword(pw) {
  return typeof pw === 'string' && pw.length >= 8 && pw.length <= 200;
}

export function createUser(email, password, lang) {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 86400000);
  const r = db.prepare(`INSERT INTO users (email, pass_hash, created_at, lang, status, trial_end, customer_key)
    VALUES (?, ?, ?, ?, 'trialing', ?, ?)`).run(
    email.toLowerCase(), hashPassword(password), now.toISOString(), lang || null, trialEnd.toISOString(),
    `wlc_${randomBytes(18).toString('base64url')}`, // 토스 규칙: 22~50자, 추측 불가능한 값
  );
  return Number(r.lastInsertRowid);
}

export function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
}
export function getUser(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function checkLogin(email, password) {
  const u = findUserByEmail(email);
  // 계정이 없어도 같은 시간이 걸리도록 가짜 검사를 한 번 수행
  if (!u) { verifyPassword(password, hashPassword('x'.repeat(12))); return null; }
  return verifyPassword(password, u.pass_hash) ? u : null;
}

export function startSession(res, req, userId) {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const exp = new Date(now.getTime() + SESSION_DAYS * 86400000);
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(tokenHash(token), userId, now.toISOString(), exp.toISOString());
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/', maxAge: SESSION_DAYS * 86400000,
  });
}

export function endSession(req, res) {
  const t = parseCookies(req.headers.cookie)[COOKIE];
  if (t) db.prepare('DELETE FROM sessions WHERE token = ?').run(tokenHash(t));
  res.clearCookie(COOKIE, { path: '/' });
}

// 모든 요청에 req.user를 붙여 줌 (로그인 안 했으면 null)
export function attachUser(req, res, next) {
  req.user = null;
  const t = parseCookies(req.headers.cookie)[COOKIE];
  if (t) {
    const s = db.prepare('SELECT * FROM sessions WHERE token = ?').get(tokenHash(t));
    if (s && s.expires_at > new Date().toISOString()) req.user = getUser(s.user_id) || null;
  }
  next();
}

// 로그인·가입 시도 제한: 같은 IP에서 15분에 20번까지
const attempts = new Map();
export function tooManyAttempts(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < 15 * 60000);
  list.push(now);
  attempts.set(ip, list);
  return list.length > 20;
}
