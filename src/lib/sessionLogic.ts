/**
 * Pure session logic — extracted for testability.
 * No React, no side effects, just decisions.
 */

export function shouldEndSession(
  exchangeCount: number,
  maxExchanges: number,
  bonusExchanges: number,
  apiSignaledComplete: boolean
): boolean {
  return apiSignaledComplete || exchangeCount >= maxExchanges + bonusExchanges;
}

export function deriveClarity(
  readinessLevel: "yes" | "a-little" | "not-yet" | null
): "yes" | "no" | "skip" {
  if (!readinessLevel) return "skip";
  if (readinessLevel === "yes") return "yes";
  if (readinessLevel === "a-little") return "yes";
  return "no";
}

export function canKeepGoing(readinessLevel: "yes" | "a-little" | "not-yet" | null): boolean {
  return readinessLevel === "not-yet";
}
