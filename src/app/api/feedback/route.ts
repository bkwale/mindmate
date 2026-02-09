import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { feedback } = await req.json();

    if (!feedback || typeof feedback !== "string" || feedback.trim().length === 0) {
      return NextResponse.json({ error: "Feedback is required" }, { status: 400 });
    }

    // Log to Vercel Functions logs — visible in Vercel dashboard
    console.log("=== MINDM8 FEEDBACK ===");
    console.log(`Date: ${new Date().toISOString()}`);
    console.log(`Feedback: ${feedback.trim()}`);
    console.log("=======================");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
