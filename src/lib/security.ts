// MindMate — Security Module (PIN Lock)
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
