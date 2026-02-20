// ============================================================
// Anonymous Event Tracking — server-side aggregation
// No personal data. No user IDs. Just anonymous counters.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "redis";

async function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  // Redis Cloud requires TLS — detect rediss:// or add TLS for cloud hosts
  const needsTLS = url.startsWith("rediss://") || url.includes("redislabs.com") || url.includes("upstash.io");

  const client = createClient({
    url,
    socket: needsTLS ? {
      tls: true,
      rejectUnauthorized: false,
      connectTimeout: 5000,
    } : {
      connectTimeout: 5000,
    },
  });
  client.on("error", () => {}); // suppress connection errors
  await client.connect();
  return client;
}

export async function POST(req: Request) {
  let client = null;
  try {
    const { event, meta } = await req.json();

    if (!event || typeof event !== "string") {
      return NextResponse.json({ error: "Missing event" }, { status: 400 });
    }

    client = await getRedis();
    if (!client) {
      return NextResponse.json({ ok: true, kv: false, reason: "No REDIS_URL configured" });
    }

    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10); // "2026-02-19"
    const hourKey = now.getUTCHours();

    // ---- Increment counters in Redis ----

    // Total event count (all time)
    await client.hIncrBy("stats:totals", event, 1);

    // Daily event count
    await client.hIncrBy(`stats:daily:${dateKey}`, event, 1);

    // Daily unique visitors (approximate via random session hash)
    if (meta?.sh) {
      await client.sAdd(`stats:visitors:${dateKey}`, meta.sh);
      await client.expire(`stats:visitors:${dateKey}`, 90 * 24 * 60 * 60);
    }

    // Hourly distribution (for time-of-day insights)
    await client.hIncrBy("stats:hours", String(hourKey), 1);

    // Mode breakdown (if event has a mode)
    if (meta?.mode) {
      await client.hIncrBy("stats:modes", meta.mode, 1);
    }

    // Store last 500 raw events for recent activity feed
    const rawEvent = JSON.stringify({
      e: event,
      t: now.toISOString(),
      m: meta?.mode || null,
    });
    await client.lPush("stats:recent", rawEvent);
    await client.lTrim("stats:recent", 0, 499);

    // Track daily active dates for retention chart
    await client.sAdd("stats:active_dates", dateKey);

    await client.quit();
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (client) try { await client.quit(); } catch {}
    // Silently succeed — don't break the app
    console.error("Track error:", error);
    return NextResponse.json({ ok: true, kv: false });
  }
}
