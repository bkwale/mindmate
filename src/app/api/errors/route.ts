// ============================================================
// Error Reporting API — stores client-side errors in Vercel KV
// Viewable on /stats dashboard
// ============================================================

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function POST(req: Request) {
  try {
    const error = await req.json();

    if (!error.message || !error.source) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Add geo info from Vercel headers
    const city = req.headers.get("x-vercel-ip-city") || "Unknown";
    const country = req.headers.get("x-vercel-ip-country") || "Unknown";
    const geo = city !== "Unknown" ? `${decodeURIComponent(city)}, ${country}` : country;

    const entry = JSON.stringify({
      msg: error.message.slice(0, 300),
      src: error.source,
      stack: error.stack?.slice(0, 500) || null,
      ua: error.userAgent || null,
      url: error.url || null,
      ctx: error.context || null,
      geo,
      t: error.timestamp || new Date().toISOString(),
    });

    // Store in a capped list (last 200 errors)
    await kv.lpush("stats:errors", entry);
    await kv.ltrim("stats:errors", 0, 199);

    // Increment daily error counter
    const dateKey = new Date().toISOString().slice(0, 10);
    await kv.hincrby("stats:daily:errors", dateKey, 1);

    // Increment per-source error counter
    await kv.hincrby("stats:error_sources", error.source, 1);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error reporter failed:", err);
    return NextResponse.json({ ok: true }); // don't fail loudly
  }
}
