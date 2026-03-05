// ============================================================
// Sync Backup — store encrypted user data in Vercel KV
// Server never sees plaintext. Only ciphertext + passphrase hash.
// ============================================================

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const MAX_PAYLOAD_SIZE = 1_000_000; // 1MB safety limit

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { passphraseHash, payload } = body;

    if (!passphraseHash || typeof passphraseHash !== "string") {
      return NextResponse.json(
        { error: "Missing passphrase hash" },
        { status: 400 }
      );
    }

    if (!payload || !payload.version || !payload.iv || !payload.ciphertext) {
      return NextResponse.json(
        { error: "Invalid backup payload" },
        { status: 400 }
      );
    }

    // Check payload size
    const size = JSON.stringify(payload).length;
    if (size > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { error: "Backup too large. Maximum 1MB." },
        { status: 413 }
      );
    }

    // Store in KV — key is hash of passphrase, value is encrypted blob
    const kvKey = `sync:${passphraseHash}`;
    await kv.set(kvKey, JSON.stringify(payload));

    return NextResponse.json({
      ok: true,
      timestamp: payload.timestamp,
    });
  } catch (error) {
    console.error("Sync backup error:", error);
    return NextResponse.json(
      { error: "Backup failed. Please try again." },
      { status: 500 }
    );
  }
}
