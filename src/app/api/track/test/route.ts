// Quick diagnostic — test Redis connection
// Visit /api/track/test?token=YOUR_STATS_SECRET to check

import { NextResponse } from "next/server";
import { createClient } from "redis";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const secret = process.env.STATS_SECRET;

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    return NextResponse.json({ error: "No REDIS_URL set", hasUrl: false });
  }

  // Mask the URL for display (show host only)
  const masked = url.replace(/\/\/.*?@/, "//***@");

  try {
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

    // Test write and read
    await client.set("test:ping", "pong");
    const result = await client.get("test:ping");
    await client.del("test:ping");
    await client.quit();

    return NextResponse.json({
      status: "connected",
      url: masked,
      tls: needsTLS,
      testWrite: result === "pong" ? "OK" : "FAIL",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      status: "failed",
      url: masked,
      error: msg,
    });
  }
}
