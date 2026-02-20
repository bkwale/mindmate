// ============================================================
// Anonymous Stats API — aggregated usage data for admin view
// Protected by a simple bearer token (STATS_SECRET env var)
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "redis";

async function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return null;

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
  client.on("error", () => {});
  await client.connect();
  return client;
}

export async function GET(req: Request) {
  // Simple auth — check for STATS_SECRET
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const secret = process.env.STATS_SECRET;

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let client = null;
  try {
    client = await getRedis();
    if (!client) {
      return NextResponse.json({
        error: "Redis not configured. Set REDIS_URL in your Vercel environment variables.",
        hasRedisUrl: !!process.env.REDIS_URL,
      }, { status: 500 });
    }

    // ---- All-time totals ----
    const totals = (await client.hGetAll("stats:totals")) as Record<string, string>;
    const totalsNum: Record<string, number> = {};
    for (const [k, v] of Object.entries(totals)) {
      totalsNum[k] = parseInt(v, 10) || 0;
    }

    // ---- Last 30 days daily breakdown ----
    const dailyData: Record<string, Record<string, number>> = {};
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayStats = await client.hGetAll(`stats:daily:${dateKey}`);
      if (dayStats && Object.keys(dayStats).length > 0) {
        const parsed: Record<string, number> = {};
        for (const [k, v] of Object.entries(dayStats)) {
          parsed[k] = parseInt(v, 10) || 0;
        }
        dailyData[dateKey] = parsed;
      }
    }

    // ---- Daily unique visitors (last 30 days) ----
    const dailyVisitors: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const count = await client.sCard(`stats:visitors:${dateKey}`);
      if (count > 0) {
        dailyVisitors[dateKey] = count;
      }
    }

    // ---- Hourly distribution ----
    const hoursRaw = await client.hGetAll("stats:hours");
    const hours: Record<string, number> = {};
    for (const [k, v] of Object.entries(hoursRaw)) {
      hours[k] = parseInt(v, 10) || 0;
    }

    // ---- Mode breakdown ----
    const modesRaw = await client.hGetAll("stats:modes");
    const modes: Record<string, number> = {};
    for (const [k, v] of Object.entries(modesRaw)) {
      modes[k] = parseInt(v, 10) || 0;
    }

    // ---- Recent events (last 50) ----
    const recentRaw = await client.lRange("stats:recent", 0, 49);
    const recent = recentRaw.map(r => {
      try { return JSON.parse(r); }
      catch { return r; }
    });

    // ---- Active dates for retention ----
    const activeDates = await client.sMembers("stats:active_dates");

    // ---- Computed metrics ----
    const totalSessions = totalsNum.session_complete || 0;
    const totalStarts = totalsNum.session_start || 0;
    const completionRate = totalStarts > 0
      ? Math.round((totalSessions / totalStarts) * 100) : 0;
    const totalCheckIns = totalsNum.checkin_complete || 0;
    const totalVoice = totalsNum.voice_used || 0;
    const totalBreatheSessions = modes.breathe || 0;

    await client.quit();

    return NextResponse.json({
      totals: totalsNum,
      computed: {
        completionRate,
        totalSessions,
        totalCheckIns,
        totalVoice,
        totalBreatheSessions,
      },
      dailyData,
      dailyVisitors,
      hours,
      modes,
      recent,
      activeDates: activeDates.sort(),
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    if (client) try { await client.quit(); } catch {}
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Stats unavailable — could not connect to Redis" }, { status: 500 });
  }
}
