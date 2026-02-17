import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Separate API endpoint for theme extraction after a session ends.
// This runs on the full session transcript and returns structured theme data.

export async function POST(req: NextRequest) {
  try {
    const { messages, mode, relationshipContext } = await req.json();

    const extractionPrompt = `You are a theme extraction system for MindM8, an emotional clarity tool.

Analyze the following reflection session and extract structured theme data.

RULES:
- Extract the PRIMARY emotion expressed (one word: e.g. frustration, anxiety, sadness, confusion, anger, guilt, loneliness, overwhelm, grief, relief, hope)
- Extract a short theme summary (one sentence, max 15 words, describing the behavioural pattern — NOT the specific event)
- Identify the relationship context if mentioned (partner, ex-partner, family, child, work, friend, self)
- If the content involves crisis-adjacent material (self-harm, abuse, trauma), set "crisis_adjacent" to true — this content should NOT be stored as a theme

ENERGY & REGULATION SIGNALS (infer from language, tone, and message patterns — never ask):
- "energy": Infer the user's energy state from their writing style and content.
  "high" = energised, motivated, fast-paced writing
  "low" = flat, tired, minimal effort in responses
  "crashed" = exhaustion after a period of high energy, burnout language
  "wired" = restless, scattered, can't focus, racing thoughts
  "neutral" = balanced, no strong energy signal
- "regulation": Infer how emotionally regulated the user appears.
  "regulated" = measured responses, able to reflect clearly
  "dysregulated" = emotional intensity without overwhelm, struggling to organise thoughts
  "shutdown" = very short responses, flat affect, withdrawn, "I don't know" repeatedly
  "flooding" = rapid, intense, long messages, jumping between topics, high emotional charge
- "trigger": If identifiable, what set things off (max 10 words). e.g. "perceived criticism from partner", "deadline pressure", "sensory overwhelm". Set to null if unclear.
- "loop": true if the user is revisiting a theme or topic they've clearly brought before, or circling the same point within this session. false otherwise.

IMPORTANT:
- Theme summaries describe PATTERNS, not events. "Tends to withdraw when feeling criticised" NOT "Had an argument about the dishes"
- Use the user's own emotional language where possible
- Be concise and factual
- Energy and regulation are INFERRED from writing style — never label or diagnose

Respond ONLY with valid JSON in this exact format:
{
  "emotion": "string",
  "theme": "string (max 15 words)",
  "context": "partner|ex-partner|family|child|work|friend|self|general",
  "crisis_adjacent": false,
  "energy": "high|low|crashed|wired|neutral",
  "regulation": "regulated|dysregulated|shutdown|flooding",
  "trigger": "string or null",
  "loop": false
}`;

    // Build the session transcript
    const transcript = messages
      .filter((m: any) => m.role === "user")
      .map((m: any) => m.content)
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 300,
      system: extractionPrompt,
      messages: [
        {
          role: "user",
          content: `Session mode: ${mode}\nUser-selected relationship context: ${relationshipContext || "none"}\n\nSession transcript (user messages only):\n${transcript}`,
        },
      ],
    });

    const textContent = response.content.find(c => c.type === "text");
    const text = textContent?.text || "{}";

    // Parse the JSON response
    try {
      const extracted = JSON.parse(text);
      return NextResponse.json(extracted);
    } catch {
      // If Claude returns non-JSON, try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return NextResponse.json(JSON.parse(jsonMatch[0]));
      }
      return NextResponse.json({
        emotion: "unspecified",
        theme: "Reflection session completed",
        context: relationshipContext || "general",
        crisis_adjacent: false,
      });
    }
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Theme extraction failed" },
      { status: 500 }
    );
  }
}
