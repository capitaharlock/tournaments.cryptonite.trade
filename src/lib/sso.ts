/**
 * Ecosystem-wide SSO helpers for *.cryptonite.trade.
 *
 * The API sets a `crypt_token` cookie with Domain=.cryptonite.trade on every
 * successful login/verify-email. All frontends (broker, tournaments, webapp)
 * read this cookie to detect existing auth and avoid re-login.
 *
 * The cookie is NOT HttpOnly so JS can read it and pass it as
 * Authorization: Bearer header to the API.
 */

const COOKIE_NAME = "crypt_token";
const COOKIE_DOMAIN = ".cryptonite.trade";
const COOKIE_MAX_AGE = 31536000; // 1 year — session ends on explicit logout, not cookie expiry

/** Read the SSO JWT from the domain cookie. Returns null if absent. */
export function getSSOToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Write the SSO cookie from JS (safety net — the API already sets it via
 * Set-Cookie header, but this covers cases like manual login in a frontend
 * that doesn't go through the API response directly).
 */
export function setSSOToken(jwt: string): void {
  if (typeof document === "undefined") return;
  const isProd = window.location.hostname.endsWith("cryptonite.trade");
  const domain = isProd ? `; Domain=${COOKIE_DOMAIN}` : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(jwt)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure${domain}`;
}

/** Clear the SSO cookie (logout). */
export function clearSSOToken(): void {
  if (typeof document === "undefined") return;
  const isProd = window.location.hostname.endsWith("cryptonite.trade");
  const domain = isProd ? `; Domain=${COOKIE_DOMAIN}` : "";
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax; Secure${domain}`;
}
