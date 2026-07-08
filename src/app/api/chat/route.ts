import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BASE_LAYER, SAFETY_LAYER, getSessionLayer, getThemeLayer, getPersonalContextLayer, getRegulationLayer, getLanguageLayer, getOpeningInstruction, SessionMode, SESSION_LIMITS } from "@/lib/prompts";

let kv: any = null;
try {
  kv = require("@vercel/kv").kv;
} catch { /* KV not configured — rate limiting disabled */ }

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const RATE_LIMIT_MAX = 50; // max API calls per token per day
const RATE_LIMIT_PREFIX = "rl:";

async function checkRateLimit(token: string | null): Promise<{ allowed: boolean; remaining: number }> {
  if (!kv || !token) return { allowed: true, remaining: RATE_LIMIT_MAX };

  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${RATE_LIMIT_PREFIX}${token}:${today}`;
    const count = await kv.incr(key);

    // Set expiry on first use (48 hours to cover timezone edges)
    if (count === 1) {
      await kv.expire(key, 172800);
    }

    return {
      allowed: count <= RATE_LIMIT_MAX,
      remaining: Math.max(0, RATE_LIMIT_MAX - count),
    };
  } catch {
    // If KV fails, allow the request — don't break the app
    return { allowed: true, remaining: RATE_LIMIT_MAX };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Rate limiting — uses anonymous token from client
    const clientToken = req.headers.get("x-mindm8-token");
    const { allowed, remaining } = await checkRateLimit(clientToken);
    if (!allowed) {
      return NextResponse.json(
        { error: "You've had a lot of sessions today. Come back tomorrow with fresh eyes." },
        { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
      );
    }
    const {
      messages,
      mode,
      exchangeCount,
      themes,
      aboutMe,
      recentEnergy,
      recentRegulation,
      language,
      generateOpening,
    }: {
      messages: { role: "user" | "assistant"; content: string }[];
      mode: SessionMode;
      exchangeCount: number;
      themes: string[] | null;
      aboutMe: string | null;
      recentEnergy?: string;
      recentRegulation?: string;
      language?: string;
      generateOpening?: boolean;
    } = body;

    const maxExchanges = SESSION_LIMITS[mode];

    // Build the layered system prompt
    const layers = [
      BASE_LAYER,
      SAFETY_LAYER,
    ];

    // Add language layer if provided
    const languageLayer = getLanguageLayer(language);
    if (languageLayer) {
      layers.push(languageLayer);
    }

    // Handle opening message generation
    if (generateOpening) {
      const openingInstruction = getOpeningInstruction(mode);
      if (openingInstruction) {
        layers.push(openingInstruction);
      }
    } else {
      layers.push(getSessionLayer(mode, exchangeCount, maxExchanges));
      layers.push(getThemeLayer(themes));

      const personalContext = getPersonalContextLayer(aboutMe);
      if (personalContext) {
        layers.push(personalContext);
      }

      const regulationContext = getRegulationLayer(recentEnergy, recentRegulation);
      if (regulationContext) {
        layers.push(regulationContext);
      }
    }

    const systemPrompt = layers.join("\n\n---\n\n");

    // For opening generation, use a synthetic user message
    const apiMessages = generateOpening
      ? [{ role: "user" as const, content: "[begin session]" }]
      : messages;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: generateOpening ? 150 : 500,
      system: systemPrompt,
      messages: apiMessages,
    });

    const textContent = response.content.find(c => c.type === "text");
    let text = textContent ? textContent.text : "I'm here when you're ready to reflect.";

    // Strip any leaked session notes or internal metadata
    text = text.replace(/\*?\*?\[.*?(?:session note|internal|note to self|instruction).*?\]\*?\*?/gi, "").trim();

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
