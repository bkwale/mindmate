// ============================================================
// Anonymous Event Tracking — server-side aggregation
// No personal data. No user IDs. Just anonymous counters.
// ============================================================

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function POST(req: Request) {
  try {
    const { event, meta } = await req.json();

    if (!event || typeof event !== "string") {
      return NextResponse.json({ error: "Missing event" }, { status: 400 });
    }

    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10); // "2026-02-19"
    const hourKey = now.getUTCHours();

    // ---- Increment counters in KV ----

    // Total event count (all time)
    await kv.hincrby("stats:totals", event, 1);

    // Daily event count
    await kv.hincrby(`stats:daily:${dateKey}`, event, 1);

    // Daily unique visitors (approximate via random session hash)
    if (meta?.sh) {
      await kv.sadd(`stats:visitors:${dateKey}`, meta.sh);
      // Auto-expire visitor sets after 90 days
      await kv.expire(`stats:visitors:${dateKey}`, 90 * 24 * 60 * 60);
    }

    // Hourly distribution (for time-of-day insights)
    await kv.hincrby("stats:hours", String(hourKey), 1);

    // Mode breakdown (if event has a mode)
    if (meta?.mode) {
      await kv.hincrby("stats:modes", meta.mode, 1);
    }

    // Voice usage tracking
    if (event === "voice_used") {
      await kv.hincrby("stats:totals", "voice_used", 0); // already counted above
    }

    // Store last 500 raw events for recent activity feed
    const rawEvent = JSON.stringify({
      e: event,
      t: now.toISOString(),
      m: meta?.mode || null,
    });
    await kv.lpush("stats:recent", rawEvent);
    await kv.ltrim("stats:recent", 0, 499);

    // Track daily active dates for retention chart
    await kv.sadd("stats:active_dates", dateKey);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    // If KV is not configured, silently succeed (don't break the app)
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("REDIS") || msg.includes("KV") || msg.includes("connect")) {
      return NextResponse.json({ ok: true, kv: false });
    }
    console.error("Track error:", error);
    return NextResponse.json({ ok: true, kv: false });
  }
}
