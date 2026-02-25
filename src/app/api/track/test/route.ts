// Quick diagnostic — test Redis connection
// Visit /api/track/test?token=YOUR_STATS_SECRET to check

import { NextResponse } from "next/server";
import { createClient } from "redis";

// Hard timeout wrapper to prevent serverless function from hanging
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

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

  // Detect cloud provider
  const isCloud = url.includes("redislabs.com") || url.includes("upstash.io");
  const protocol = url.split("://")[0];

  // Build connection URL
  let connUrl = url;
  if (isCloud && url.startsWith("redis://")) {
    connUrl = url.replace("redis://", "rediss://");
  }
  const connProtocol = connUrl.split("://")[0];

  const diagnostics: Record<string, unknown> = {
    originalProtocol: protocol,
    connProtocol,
    isCloud,
    upgraded: protocol !== connProtocol,
    host: masked,
  };

  let client = null;
  try {
    client = createClient({
      url: connUrl,
      socket: { connectTimeout: 4000 },
    });

    const errors: string[] = [];
    client.on("error", (err) => {
      errors.push(err?.message || String(err));
    });

    // Connect with hard timeout
    await withTimeout(client.connect(), 4000, "Redis connect");

    // Test write/read
    await withTimeout(client.set("test:ping", "pong"), 2000, "Redis SET");
    const result = await withTimeout(client.get("test:ping"), 2000, "Redis GET");
    await client.del("test:ping");
    await client.quit();

    return NextResponse.json({
      status: "connected",
      testWrite: result === "pong" ? "OK" : "FAIL",
      ...diagnostics,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    if (client) try { await client.quit(); } catch {}
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      status: "failed",
      error: msg,
      ...diagnostics,
    });
  }
}
