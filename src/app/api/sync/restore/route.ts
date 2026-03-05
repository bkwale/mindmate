// ============================================================
// Sync Restore — fetch encrypted user data from Vercel KV
// Returns ciphertext only. Decryption happens client-side.
// ============================================================

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { passphraseHash } = body;

    if (!passphraseHash || typeof passphraseHash !== "string") {
      return NextResponse.json(
        { error: "Missing passphrase hash" },
        { status: 400 }
      );
    }

    // Fetch from KV
    const kvKey = `sync:${passphraseHash}`;
    const raw = await kv.get(kvKey) as string | null;

    if (!raw) {
      return NextResponse.json({
        ok: true,
        exists: false,
      });
    }

    // Parse the stored payload
    const payload = typeof raw === "string" ? JSON.parse(raw) : raw;

    return NextResponse.json({
      ok: true,
      exists: true,
      payload,
    });
  } catch (error) {
    console.error("Sync restore error:", error);
    return NextResponse.json(
      { error: "Could not retrieve backup. Please try again." },
      { status: 500 }
    );
  }
}
