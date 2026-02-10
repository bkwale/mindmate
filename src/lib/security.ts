// MindM8 — Security Module (PIN Lock)
// Uses Web Crypto API for hashing. No external dependencies.

const SECURITY_KEY = "mindmate_security";

interface SecurityData {
  pinHash: string;
  salt: string;
  createdAt: string;
}

// Generate a random salt
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Hash a PIN with salt using SHA-256
async function hashPIN(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Check if a PIN has been set
export function isPINEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const data = localStorage.getItem(SECURITY_KEY);
  return data !== null;
}

// Set a new PIN
export async function setPIN(pin: string): Promise<void> {
  const salt = generateSalt();
  const pinHash = await hashPIN(pin, salt);
  const security: SecurityData = {
    pinHash,
    salt,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(SECURITY_KEY, JSON.stringify(security));
}

// Verify a PIN against stored hash
export async function verifyPIN(pin: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(SECURITY_KEY);
  if (!raw) return false;

  const security: SecurityData = JSON.parse(raw);
  const inputHash = await hashPIN(pin, security.salt);
  return inputHash === security.pinHash;
}

// Remove the PIN (disable lock)
export function removePIN(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SECURITY_KEY);
}

// Change PIN — verify old, set new
export async function changePIN(
  oldPin: string,
  newPin: string
): Promise<boolean> {
  const valid = await verifyPIN(oldPin);
  if (!valid) return false;
  await setPIN(newPin);
  return true;
}

// ============================================================
// Recovery Words — emotional self-recognition as identity proof
// ============================================================
// During PIN setup, the user chooses 3 words that "feel like theirs."
// These are hashed individually — can't be read from localStorage.
// On recovery: if 2 of 3 match, reset PIN but keep all data.

const RECOVERY_KEY = "mindmate_recovery";

interface RecoveryData {
  wordHashes: string[];  // 3 hashed words
  salt: string;
}

// Normalise a word for consistent hashing (lowercase, trimmed, no extra spaces)
function normaliseWord(word: string): string {
  return word.toLowerCase().trim().replace(/\s+/g, " ");
}

// Save 3 recovery words (hashed)
export async function setRecoveryWords(words: [string, string, string]): Promise<void> {
  const salt = generateSalt();
  const wordHashes = await Promise.all(
    words.map(w => hashPIN(normaliseWord(w), salt))
  );
  const recovery: RecoveryData = { wordHashes, salt };
  localStorage.setItem(RECOVERY_KEY, JSON.stringify(recovery));
}

// Check if recovery words have been set
export function hasRecoveryWords(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(RECOVERY_KEY) !== null;
}

// Verify recovery words — returns true if at least 2 of 3 match (any order)
export async function verifyRecoveryWords(attempts: string[]): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(RECOVERY_KEY);
  if (!raw) return false;

  const recovery: RecoveryData = JSON.parse(raw);
  const attemptHashes = await Promise.all(
    attempts.map(w => hashPIN(normaliseWord(w), recovery.salt))
  );

  // Count how many stored hashes are matched by any attempt
  let matches = 0;
  for (const storedHash of recovery.wordHashes) {
    if (attemptHashes.includes(storedHash)) matches++;
  }
  return matches >= 2;
}

// Reset only the PIN (keep all session data, themes, recovery words)
export async function resetPINOnly(newPin: string): Promise<void> {
  await setPIN(newPin);
}

// Full reset — clears ALL user data (PIN, sessions, themes, everything)
// Last resort when user can't remember PIN or recovery words.
export function resetAllData(): void {
  if (typeof window === "undefined") return;
  localStorage.clear();
}

// ============================================================
// Auto-lock — idle timeout and visibility-based re-locking
// ============================================================

const LOCK_TIMEOUT_KEY = "mindmate_lock_timeout";
const LAST_ACTIVITY_KEY = "mindmate_last_activity";

export type LockTimeout = 0 | 1 | 3 | 5 | -1; // 0 = immediate on background, -1 = never

const DEFAULT_TIMEOUT: LockTimeout = 3; // 3 minutes

// Get the user's preferred auto-lock timeout (in minutes)
export function getAutoLockTimeout(): LockTimeout {
  if (typeof window === "undefined") return DEFAULT_TIMEOUT;
  const stored = localStorage.getItem(LOCK_TIMEOUT_KEY);
  if (stored === null) return DEFAULT_TIMEOUT;
  const parsed = parseInt(stored, 10);
  if ([0, 1, 3, 5, -1].includes(parsed)) return parsed as LockTimeout;
  return DEFAULT_TIMEOUT;
}

// Set the auto-lock timeout preference
export function setAutoLockTimeout(minutes: LockTimeout): void {
  localStorage.setItem(LOCK_TIMEOUT_KEY, minutes.toString());
}

// Record user activity (called on interactions)
export function updateLastActivity(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

// Get the timestamp of last activity
export function getLastActivity(): number {
  if (typeof window === "undefined") return Date.now();
  const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
  return stored ? parseInt(stored, 10) : Date.now();
}

// Check if the app should auto-lock based on idle time
export function shouldAutoLock(): boolean {
  if (!isPINEnabled()) return false;
  const timeout = getAutoLockTimeout();
  if (timeout === -1) return false; // never auto-lock
  if (timeout === 0) return true; // always lock on check (immediate)
  const elapsed = Date.now() - getLastActivity();
  return elapsed > timeout * 60 * 1000;
}
