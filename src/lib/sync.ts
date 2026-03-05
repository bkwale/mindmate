// ============================================================
// Sync Passphrase — encrypted backup & restore across devices
// No accounts. No email. Just a memorable passphrase.
// All encryption happens client-side. Server only sees ciphertext.
// ============================================================

// ---- localStorage keys to back up ----
const SYNC_KEYS = [
  "mindmate_profile",
  "mindmate_sessions",
  "mindmate_themes",
  "mindmate_checkins",
  "mindmate_letters",
  "mindmate_followups",
  "mindmate_openloop",
  "mindmate_cohort",
  "mindmate_security",
  "mindmate_recovery",
  "mindmate_lock_timeout",
  "mindmate_seen_version",
];

const SYNC_CONFIG_KEY = "mindmate_sync_config";

export interface SyncConfig {
  lastBackupAt: string | null;
}

export interface BackupPayload {
  version: string;
  iv: string;
  ciphertext: string;
  timestamp: string;
}

export interface BackupData {
  version: string;
  data: Record<string, string | null>;
  backupAt: string;
}

// ---- Sync config (stored locally) ----

export function getSyncConfig(): SyncConfig {
  if (typeof window === "undefined") return { lastBackupAt: null };
  const raw = localStorage.getItem(SYNC_CONFIG_KEY);
  if (!raw) return { lastBackupAt: null };
  try { return JSON.parse(raw); }
  catch { return { lastBackupAt: null }; }
}

export function setSyncConfig(config: SyncConfig): void {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
}

// ---- Crypto helpers (Web Crypto API) ----

// Convert string to ArrayBuffer
function strToBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  const uint8 = encoder.encode(str);
  return uint8.buffer as ArrayBuffer;
}

// Convert ArrayBuffer to hex string
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert hex string to Uint8Array
function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// ---- Key derivation ----

// Derive an AES-256-GCM encryption key from the passphrase
// Uses PBKDF2 with 100,000 iterations — never sent to server
export async function deriveKeyFromPassphrase(passphrase: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    strToBuffer(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Use passphrase itself as salt (deterministic — same passphrase = same key)
  const salt = strToBuffer("mindm8-sync-salt:" + passphrase);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Hash passphrase for server-side storage key (one-way, separate from encryption key)
export async function hashPassphrase(passphrase: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    strToBuffer("mindm8-kv-key:" + passphrase)
  );
  return bufToHex(hash);
}

// ---- Gather & restore data ----

// Collect all localStorage data into a single object
export function gatherBackupData(): BackupData {
  const data: Record<string, string | null> = {};
  for (const key of SYNC_KEYS) {
    data[key] = localStorage.getItem(key);
  }
  return {
    version: "1",
    data,
    backupAt: new Date().toISOString(),
  };
}

// Write backup data back to localStorage
export function restoreBackupData(
  backup: BackupData,
  mode: "overwrite" | "merge" = "overwrite"
): number {
  let restored = 0;

  for (const [key, value] of Object.entries(backup.data)) {
    if (value === null || value === undefined) continue;

    if (mode === "overwrite") {
      localStorage.setItem(key, value);
      restored++;
    } else if (mode === "merge") {
      const existing = localStorage.getItem(key);
      if (!existing) {
        // No local data — just restore
        localStorage.setItem(key, value);
        restored++;
      } else {
        // Both exist — merge arrays by timestamp, keep unique entries
        try {
          const local = JSON.parse(existing);
          const remote = JSON.parse(value);
          if (Array.isArray(local) && Array.isArray(remote)) {
            const merged = mergeArrays(local, remote);
            localStorage.setItem(key, JSON.stringify(merged));
            restored++;
          } else if (typeof local === "object" && typeof remote === "object") {
            // Objects: prefer remote (newer backup)
            localStorage.setItem(key, value);
            restored++;
          }
          // Strings: keep local (user's current choice)
        } catch {
          // Can't parse — keep local
        }
      }
    }
  }

  return restored;
}

// Merge two arrays, dedup by id or timestamp
function mergeArrays(local: any[], remote: any[]): any[] {
  const seen = new Set<string>();
  const merged: any[] = [];

  // Add all local items first
  for (const item of local) {
    const id = item.id || item.timestamp || JSON.stringify(item);
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(item);
    }
  }

  // Add remote items that aren't already present
  for (const item of remote) {
    const id = item.id || item.timestamp || JSON.stringify(item);
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(item);
    }
  }

  return merged;
}

// ---- Encrypt & decrypt ----

export async function encryptBackup(
  key: CryptoKey,
  data: BackupData
): Promise<BackupPayload> {
  const plaintext = JSON.stringify(data);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const ivForEncrypt = iv as unknown as Uint8Array<ArrayBuffer>;

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivForEncrypt },
    key,
    strToBuffer(plaintext)
  );

  return {
    version: "1",
    iv: bufToHex(iv.buffer as ArrayBuffer),
    ciphertext: bufToHex(ciphertext),
    timestamp: new Date().toISOString(),
  };
}

export async function decryptBackup(
  key: CryptoKey,
  payload: BackupPayload
): Promise<BackupData | null> {
  try {
    const iv = hexToBuf(payload.iv);
    const ciphertext = hexToBuf(payload.ciphertext);

    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as unknown as Uint8Array<ArrayBuffer> },
      key,
      ciphertext as unknown as ArrayBuffer
    );

    const json = new TextDecoder().decode(plaintext);
    return JSON.parse(json) as BackupData;
  } catch {
    // Wrong passphrase or corrupted data — GCM auth fails
    return null;
  }
}

// ---- Main backup & restore flows ----

export async function createBackup(passphrase: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Derive encryption key and storage hash
    const [key, passphraseHash] = await Promise.all([
      deriveKeyFromPassphrase(passphrase),
      hashPassphrase(passphrase),
    ]);

    // 2. Gather all localStorage data
    const data = gatherBackupData();

    // 3. Encrypt
    const payload = await encryptBackup(key, data);

    // 4. Send to server
    const res = await fetch("/api/sync/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passphraseHash, payload }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || "Backup failed" };
    }

    // 5. Update local sync config
    setSyncConfig({ lastBackupAt: new Date().toISOString() });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Backup failed",
    };
  }
}

export async function restoreFromBackup(
  passphrase: string,
  mode: "overwrite" | "merge" = "overwrite"
): Promise<{
  success: boolean;
  keysRestored?: number;
  backupDate?: string;
  error?: string;
}> {
  try {
    // 1. Derive encryption key and storage hash
    const [key, passphraseHash] = await Promise.all([
      deriveKeyFromPassphrase(passphrase),
      hashPassphrase(passphrase),
    ]);

    // 2. Fetch encrypted data from server
    const res = await fetch("/api/sync/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passphraseHash }),
    });

    if (!res.ok) {
      return { success: false, error: "Could not reach backup server" };
    }

    const result = await res.json();
    if (!result.exists) {
      return { success: false, error: "No backup found for this passphrase" };
    }

    // 3. Decrypt
    const data = await decryptBackup(key, result.payload);
    if (!data) {
      return { success: false, error: "Passphrase doesn't match. Please try again." };
    }

    // 4. Restore to localStorage
    const keysRestored = restoreBackupData(data, mode);

    // 5. Update sync config
    setSyncConfig({ lastBackupAt: data.backupAt });

    return {
      success: true,
      keysRestored,
      backupDate: data.backupAt,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Restore failed",
    };
  }
}
