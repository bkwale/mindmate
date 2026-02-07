import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BASE_LAYER, SAFETY_LAYER, getSessionLayer, getThemeLayer, SessionMode, SESSION_LIMITS } from "@/lib/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      mode,
      exchangeCount,
      themes,
    }: {
      messages: { role: "user" | "assistant"; content: string }[];
      mode: SessionMode;
      exchangeCount: number;
      themes: string[] | null;
    } = body;

    const maxExchanges = SESSION_LIMITS[mode];

    // Build the layered system prompt
    const systemPrompt = [
      BASE_LAYER,
      SAFETY_LAYER,
      getSessionLayer(mode, exchangeCount, maxExchanges),
      getThemeLayer(themes),
    ].join("\n\n---\n\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 500,
      system: systemPrompt,
      messages: messages,
    });

    const textContent = response.content.find(c => c.type === "text");
    const text = textContent ? textContent.text : "I'm here when you're ready to reflect.";

    return NextResponse.json({
      message: text,
      isComplete: exchangeCount + 1 >= maxExchanges,
    });
  } catch (error: any) {
    console.error("API error:", error);

    if (error?.status === 401) {
      return NextResponse.json(
        { error: "API key not configured. Please add your Anthropic API key to .env.local" },
        { status: 401 }
      );
    }

    const errorMessage = error?.message || "Something went wrong.";
    const errorStatus = error?.status || 500;
    return NextResponse.json(
      { error: `API Error (${errorStatus}): ${errorMessage}` },
      { status: errorStatus }
    );
  }
}
