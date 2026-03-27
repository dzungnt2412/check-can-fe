const AUTH_STORAGE_KEY = 'sheetmapper_auth';
const AUTH_EXPIRED_EVENT = 'auth:expired';

function decodeBase64Url(rawValue) {
  const normalized = String(rawValue || '').replace(/-/g, '+').replace(/_/g, '/');
  const padLength = normalized.length % 4;
  const padded = padLength ? `${normalized}${'='.repeat(4 - padLength)}` : normalized;
  return atob(padded);
}

function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = decodeBase64Url(parts[1]);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function getTokenExpiryTimeMs(token) {
  const payload = parseJwtPayload(token);
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp) || exp <= 0) return 0;
  return exp * 1000;
}

export function isTokenExpired(token, offsetSeconds = 0) {
  const expiryTimeMs = getTokenExpiryTimeMs(token);
  if (!expiryTimeMs) return false;
  return Date.now() >= expiryTimeMs - Number(offsetSeconds || 0) * 1000;
}

export function notifyAuthExpired(reason = 'token_expired') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail: { reason } }));
}

function safeParseAuth(rawValue) {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.accessToken || !parsed.user?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getStoredAuth() {
  if (typeof window === 'undefined') return null;
  const parsed = safeParseAuth(window.localStorage.getItem(AUTH_STORAGE_KEY));
  if (!parsed) return null;
  if (isTokenExpired(parsed.accessToken)) {
    clearStoredAuth();
    return null;
  }
  return parsed;
}

export function getAccessToken() {
  return getStoredAuth()?.accessToken || '';
}

export function persistAuth(payload) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function handleAuthExpired(reason = 'token_expired') {
  clearStoredAuth();
  notifyAuthExpired(reason);
}

export { AUTH_STORAGE_KEY, AUTH_EXPIRED_EVENT };
