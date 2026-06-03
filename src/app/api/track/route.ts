// ============================================================
// Anonymous Event Tracking — server-side aggregation
// No personal data. No user IDs. Just anonymous counters.
// Uses Vercel KV (Upstash) — no more Redis Cloud headaches.
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
    const dateKey = now.toISOString().slice(0, 10); // "2026-03-04"
    const hourKey = now.getUTCHours();

    // ---- Geolocation from Vercel headers ----
    const city = req.headers.get("x-vercel-ip-city") || "Unknown";
    const country = req.headers.get("x-vercel-ip-country") || "Unknown";
    const region = req.headers.get("x-vercel-ip-country-region") || "";
    const geoLabel = city !== "Unknown" && country !== "Unknown"
      ? `${decodeURIComponent(city)}, ${country}`
      : country !== "Unknown" ? country : "Unknown";

    // ---- Increment counters ----

    // Total event count (all time)
    await kv.hincrby("stats:totals", event, 1);

    // Daily event count
    await kv.hincrby(`stats:daily:${dateKey}`, event, 1);

    // Daily unique visitors (approximate via random session hash)
    if (meta?.sh) {
      await kv.sadd(`stats:visitors:${dateKey}`, meta.sh);
      await kv.expire(`stats:visitors:${dateKey}`, 90 * 24 * 60 * 60);
    }

    // Hourly distribution (for time-of-day insights)
    await kv.hincrby("stats:hours", String(hourKey), 1);

    // Mode breakdown (if event has a mode)
    if (meta?.mode) {
      await kv.hincrby("stats:modes", meta.mode, 1);
    }

    // ---- Geography tracking ----
    if (country !== "Unknown") {
      await kv.hincrby("stats:geo:countries", country, 1);
    }
    if (city !== "Unknown") {
      await kv.hincrby("stats:geo:cities", geoLabel, 1);
    }
    if (region && country !== "Unknown") {
      await kv.hincrby("stats:geo:regions", `${region}, ${country}`, 1);
    }
    if (meta?.sh && city !== "Unknown") {
      await kv.sadd(`stats:geo:daily:${dateKey}`, `${meta.sh}:${geoLabel}`);
      await kv.expire(`stats:geo:daily:${dateKey}`, 90 * 24 * 60 * 60);
    }

    // ---- Source/Ref tracking (pilot partners) ----
    // If the event has a ref tag (e.g. "hmg", "worcester"), track it separately
    if (meta?.ref) {
      const ref = meta.ref;
      // Total events per source
      await kv.hincrby(`stats:sources:${ref}`, event, 1);
      // Daily events per source
      await kv.hincrby(`stats:sources:${ref}:daily:${dateKey}`, event, 1);
      // Unique visitors per source per day
      if (meta?.sh) {
        await kv.sadd(`stats:sources:${ref}:visitors:${dateKey}`, meta.sh);
        await kv.expire(`stats:sources:${ref}:visitors:${dateKey}`, 90 * 24 * 60 * 60);
      }
      // Mode breakdown per source
      if (meta?.mode) {
        await kv.hincrby(`stats:sources:${ref}:modes`, meta.mode, 1);
      }
      // Track which sources exist
      await kv.sadd("stats:sources", ref);
    }

    // Store last 500 raw events for recent activity feed
    const rawEvent = JSON.stringify({
      e: event,
      t: now.toISOString(),
      m: meta?.mode || null,
      g: geoLabel !== "Unknown" ? geoLabel : undefined,
      r: meta?.ref || undefined,
    });
    await kv.lpush("stats:recent", rawEvent);
    await kv.ltrim("stats:recent", 0, 499);

    // Track daily active dates for retention chart
    await kv.sadd("stats:active_dates", dateKey);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Track error:", error);
    return NextResponse.json({ ok: true, kv: false });
  }
}
