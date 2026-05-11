import {
  RUBRIC,
  CRITERION_IDS,
  MAX_SCORE_PER_CRITERION,
  MAX_TOTAL_SCORE,
  type CriterionDefinition,
  type EvalResult,
} from "@/lib/eval/rubric";
import { parseAndValidateResponse } from "@/lib/eval/scorer";
import {
  EVAL_SCENARIOS,
  SCENARIOS_BY_MODE,
  buildTranscriptFromUserMessages,
  type EvalScenario,
} from "@/lib/eval/templates";

// ---------------------------------------------------------------------------
// Rubric structure validation
// ---------------------------------------------------------------------------

describe("Rubric structure", () => {
  it("has a version string", () => {
    expect(typeof RUBRIC.version).toBe("string");
    expect(RUBRIC.version.length).toBeGreaterThan(0);
  });

  it("contains exactly 6 criteria", () => {
    expect(RUBRIC.criteria).toHaveLength(6);
  });

  const expectedIds = [
    "safety",
    "therapeutic_alignment",
    "warmth",
    "session_pacing",
    "clarity_facilitation",
    "boundary_respect",
  ];

  it("contains all expected criterion IDs", () => {
    expect(CRITERION_IDS).toEqual(expectedIds);
  });

  it.each(RUBRIC.criteria)(
    "criterion '$name' has valid min/max scores",
    (criterion: CriterionDefinition) => {
      expect(criterion.minScore).toBe(0);
      expect(criterion.maxScore).toBe(MAX_SCORE_PER_CRITERION);
    }
  );

  it.each(RUBRIC.criteria)(
    "criterion '$name' has scoring levels for 0 through 5",
    (criterion: CriterionDefinition) => {
      for (let i = 0; i <= MAX_SCORE_PER_CRITERION; i++) {
        expect(criterion.levels[i]).toBeDefined();
        expect(typeof criterion.levels[i]).toBe("string");
        expect(criterion.levels[i].length).toBeGreaterThan(0);
      }
    }
  );

  it.each(RUBRIC.criteria)(
    "criterion '$name' has a non-empty description",
    (criterion: CriterionDefinition) => {
      expect(criterion.description.length).toBeGreaterThan(0);
    }
  );

  it("MAX_TOTAL_SCORE equals criteria count times max per criterion", () => {
    expect(MAX_TOTAL_SCORE).toBe(RUBRIC.criteria.length * MAX_SCORE_PER_CRITERION);
  });
});

// ---------------------------------------------------------------------------
// Score output shape validation
// ---------------------------------------------------------------------------

describe("Score output validation (parseAndValidateResponse)", () => {
  const validResponse = JSON.stringify({
    scores: [
      { criterionId: "safety", score: 5, rationale: "No harmful content." },
      { criterionId: "therapeutic_alignment", score: 4, rationale: "Good open questions." },
      { criterionId: "warmth", score: 4, rationale: "Warm and grounded." },
      { criterionId: "session_pacing", score: 3, rationale: "Slightly rushed." },
      { criterionId: "clarity_facilitation", score: 4, rationale: "User-led insights." },
      { criterionId: "boundary_respect", score: 5, rationale: "Clean boundaries." },
    ],
    overallRationale: "Strong session overall.",
  });

  it("parses a valid response without error", () => {
    const result = parseAndValidateResponse(validResponse);
    expect(result.scores).toHaveLength(6);
    expect(result.overallRationale).toBe("Strong session overall.");
  });

  it("strips markdown code fences from response", () => {
    const wrapped = "```json\n" + validResponse + "\n```";
    const result = parseAndValidateResponse(wrapped);
    expect(result.scores).toHaveLength(6);
  });

  it("returns scores with correct criterion IDs", () => {
    const result = parseAndValidateResponse(validResponse);
    const ids = result.scores.map((s) => s.criterionId);
    expect(ids).toEqual(expect.arrayContaining(CRITERION_IDS));
  });

  it("returns scores within valid range (0-5)", () => {
    const result = parseAndValidateResponse(validResponse);
    for (const score of result.scores) {
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(MAX_SCORE_PER_CRITERION);
    }
  });

  it("returns non-empty rationale for each criterion", () => {
    const result = parseAndValidateResponse(validResponse);
    for (const score of result.scores) {
      expect(typeof score.rationale).toBe("string");
      expect(score.rationale.length).toBeGreaterThan(0);
    }
  });

  it("rejects invalid JSON", () => {
    expect(() => parseAndValidateResponse("not json")).toThrow("invalid JSON");
  });

  it("rejects missing scores array", () => {
    const bad = JSON.stringify({ overallRationale: "test" });
    expect(() => parseAndValidateResponse(bad)).toThrow("missing 'scores' array");
  });

  it("rejects missing overallRationale", () => {
    const bad = JSON.stringify({ scores: [] });
    expect(() => parseAndValidateResponse(bad)).toThrow("missing 'overallRationale'");
  });

  it("rejects missing criterion ID", () => {
    const incomplete = JSON.stringify({
      scores: [
        { criterionId: "safety", score: 5, rationale: "Fine." },
        // Missing the other 5
      ],
      overallRationale: "Incomplete.",
    });
    expect(() => parseAndValidateResponse(incomplete)).toThrow("missing criterion");
  });

  it("rejects out-of-range score", () => {
    const badScore = JSON.stringify({
      scores: [
        { criterionId: "safety", score: 7, rationale: "Too high." },
        { criterionId: "therapeutic_alignment", score: 4, rationale: "Fine." },
        { criterionId: "warmth", score: 4, rationale: "Fine." },
        { criterionId: "session_pacing", score: 3, rationale: "Fine." },
        { criterionId: "clarity_facilitation", score: 4, rationale: "Fine." },
        { criterionId: "boundary_respect", score: 5, rationale: "Fine." },
      ],
      overallRationale: "Bad score.",
    });
    expect(() => parseAndValidateResponse(badScore)).toThrow("Invalid score");
  });

  it("rejects empty rationale", () => {
    const emptyRationale = JSON.stringify({
      scores: [
        { criterionId: "safety", score: 5, rationale: "" },
        { criterionId: "therapeutic_alignment", score: 4, rationale: "Fine." },
        { criterionId: "warmth", score: 4, rationale: "Fine." },
        { criterionId: "session_pacing", score: 3, rationale: "Fine." },
        { criterionId: "clarity_facilitation", score: 4, rationale: "Fine." },
        { criterionId: "boundary_respect", score: 5, rationale: "Fine." },
      ],
      overallRationale: "Empty rationale.",
    });
    expect(() => parseAndValidateResponse(emptyRationale)).toThrow("Missing rationale");
  });
});

// ---------------------------------------------------------------------------
// EvalResult shape contract
// ---------------------------------------------------------------------------

describe("EvalResult shape", () => {
  it("can be constructed with correct types", () => {
    const result: EvalResult = {
      mode: "reflect",
      scenarioName: "test-scenario",
      scores: CRITERION_IDS.map((id) => ({
        criterionId: id,
        score: 4,
        rationale: "Test rationale.",
      })),
      totalScore: 24,
      maxPossibleScore: MAX_TOTAL_SCORE,
      overallRationale: "Test overall rationale.",
    };

    expect(result.scores).toHaveLength(CRITERION_IDS.length);
    expect(result.totalScore).toBeLessThanOrEqual(result.maxPossibleScore);
    expect(result.maxPossibleScore).toBe(MAX_TOTAL_SCORE);
  });
});

// ---------------------------------------------------------------------------
// Template completeness
// ---------------------------------------------------------------------------

describe("Eval templates", () => {
  it("contains exactly 6 scenarios", () => {
    expect(EVAL_SCENARIOS).toHaveLength(6);
  });

  it("has 2 scenarios for reflect mode", () => {
    expect(SCENARIOS_BY_MODE.reflect).toHaveLength(2);
  });

  it("has 2 scenarios for prepare mode", () => {
    expect(SCENARIOS_BY_MODE.prepare).toHaveLength(2);
  });

  it("has 2 scenarios for ground mode", () => {
    expect(SCENARIOS_BY_MODE.ground).toHaveLength(2);
  });

  it("has 0 scenarios for breathe mode (no AI interaction)", () => {
    expect(SCENARIOS_BY_MODE.breathe).toHaveLength(0);
  });

  it.each(EVAL_SCENARIOS)(
    "scenario '$name' has a non-empty description",
    (scenario: EvalScenario) => {
      expect(scenario.description.length).toBeGreaterThan(0);
    }
  );

  it.each(EVAL_SCENARIOS)(
    "scenario '$name' has at least 2 user messages",
    (scenario: EvalScenario) => {
      expect(scenario.userMessages.length).toBeGreaterThanOrEqual(2);
    }
  );

  it.each(EVAL_SCENARIOS)(
    "scenario '$name' has a valid mode",
    (scenario: EvalScenario) => {
      expect(["reflect", "prepare", "ground", "breathe"]).toContain(scenario.mode);
    }
  );

  it.each(EVAL_SCENARIOS)(
    "scenario '$name' user messages are non-empty strings",
    (scenario: EvalScenario) => {
      for (const msg of scenario.userMessages) {
        expect(typeof msg).toBe("string");
        expect(msg.length).toBeGreaterThan(0);
      }
    }
  );

  it("every scenario name is unique", () => {
    const names = EVAL_SCENARIOS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

// ---------------------------------------------------------------------------
// buildTranscriptFromUserMessages
// ---------------------------------------------------------------------------

describe("buildTranscriptFromUserMessages", () => {
  it("creates alternating user/assistant messages", () => {
    const transcript = buildTranscriptFromUserMessages(["Hello", "I feel sad"]);
    expect(transcript).toHaveLength(4); // user, assistant, user, assistant
    expect(transcript[0].role).toBe("user");
    expect(transcript[1].role).toBe("assistant");
    expect(transcript[2].role).toBe("user");
    expect(transcript[3].role).toBe("assistant");
  });

  it("starts with the first user message", () => {
    const transcript = buildTranscriptFromUserMessages(["Hello"]);
    expect(transcript[0]).toEqual({ role: "user", content: "Hello" });
  });

  it("ends with an assistant placeholder", () => {
    const transcript = buildTranscriptFromUserMessages(["Hello", "How are you"]);
    const last = transcript[transcript.length - 1];
    expect(last.role).toBe("assistant");
  });

  it("preserves user message content", () => {
    const messages = ["First message", "Second message", "Third message"];
    const transcript = buildTranscriptFromUserMessages(messages);
    const userMessages = transcript.filter((m) => m.role === "user");
    expect(userMessages.map((m) => m.content)).toEqual(messages);
  });
});
