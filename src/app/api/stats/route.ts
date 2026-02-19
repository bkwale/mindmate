// ============================================================
// Anonymous Stats API — aggregated usage data for admin view
// Protected by a simple bearer token (STATS_SECRET env var)
// ============================================================

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(req: Request) {
  // Simple auth — check for STATS_SECRET
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const secret = process.env.STATS_SECRET;

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ---- All-time totals ----
    const totals = (await kv.hgetall("stats:totals")) as Record<string, number> || {};

    // ---- Last 30 days daily breakdown ----
    const dailyData: Record<string, Record<string, number>> = {};
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayStats = (await kv.hgetall(`stats:daily:${dateKey}`)) as Record<string, number> | null;
      if (dayStats && Object.keys(dayStats).length > 0) {
        dailyData[dateKey] = dayStats;
      }
    }

    // ---- Daily unique visitors (last 30 days) ----
    const dailyVisitors: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const count = await kv.scard(`stats:visitors:${dateKey}`);
      if (count > 0) {
        dailyVisitors[dateKey] = count;
      }
    }

    // ---- Hourly distribution ----
    const hours = (await kv.hgetall("stats:hours")) as Record<string, number> || {};

    // ---- Mode breakdown ----
    const modes = (await kv.hgetall("stats:modes")) as Record<string, number> || {};

    // ---- Recent events (last 50) ----
    const recentRaw = (await kv.lrange("stats:recent", 0, 49)) as string[];
    const recent = recentRaw.map(r => {
      try { return typeof r === "string" ? JSON.parse(r) : r; }
      catch { return r; }
    });

    // ---- Active dates for retention ----
    const activeDates = await kv.smembers("stats:active_dates") as string[];

    // ---- Computed metrics ----
    const totalSessions = (totals.session_complete || 0);
    const totalStarts = (totals.session_start || 0);
    const completionRate = totalStarts > 0
      ? Math.round((totalSessions / totalStarts) * 100) : 0;
    const totalCheckIns = totals.checkin_complete || 0;
    const totalVoice = totals.voice_used || 0;
    const totalBreatheSessions = (modes.breathe || 0);

    return NextResponse.json({
      totals,
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
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Stats unavailable — KV may not be configured" }, { status: 500 });
  }
}
