// Quick diagnostic — test Vercel KV connection
// Visit /api/track/test?token=YOUR_STATS_SECRET to check

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const secret = process.env.STATS_SECRET;

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasKvUrl = !!process.env.KV_REST_API_URL;
  const hasKvToken = !!process.env.KV_REST_API_TOKEN;

  if (!hasKvUrl || !hasKvToken) {
    return NextResponse.json({
      status: "not_configured",
      hasKvUrl,
      hasKvToken,
    });
  }

  try {
    // Test write and read
    await kv.set("test:ping", "pong");
    const result = await kv.get("test:ping");
    await kv.del("test:ping");

    return NextResponse.json({
      status: "connected",
      testWrite: result === "pong" ? "OK" : "FAIL",
      provider: "Vercel KV (Upstash)",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      status: "failed",
      error: msg,
      hasKvUrl,
      hasKvToken,
    });
  }
}
