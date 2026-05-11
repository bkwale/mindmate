/**
 * Anonymous rate-limiting token.
 * Generated once, stored in localStorage. Not a user ID — just
 * a random string so the server can count requests per device.
 * Clearing localStorage resets it (and also wipes all session data).
 */

const TOKEN_KEY = "mindm8_rt";

export function getRateToken(): string {
  if (typeof window === "undefined") return "";

  const existing = localStorage.getItem(TOKEN_KEY);
  if (existing) return existing;

  const token = crypto.randomUUID?.()
    || Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem(TOKEN_KEY, token);
  return token;
}
