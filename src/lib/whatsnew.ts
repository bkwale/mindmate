// MindM8 — What's New
// Tracks app version and shows changelog to returning users.

const SEEN_VERSION_KEY = "mindmate_seen_version";

export const CURRENT_VERSION = "1.3";

export interface ChangelogEntry {
  version: string;
  title: string;
  highlights: string[];
}

// Only the latest entry shows on the home screen.
// Older entries live here as a record.
export const changelog: ChangelogEntry[] = [
  {
    version: "1.3",
    title: "Arrival & Readiness",
    highlights: [
      "New arrival framing — each mode now helps you arrive clearer, ready, or present",
      "Readiness moment after sessions — notice if you feel clearer",
      "Auto-lock — your reflections lock when you step away",
    ],
  },
  {
    version: "1.2",
    title: "Retention & PWA",
    highlights: [
      "Smart check-ins detect patterns in how you arrive",
      "Open loops — revisit unfinished thoughts",
      "Add to home screen and push notifications",
    ],
  },
];

// Get the latest changelog entry
export function getLatestChangelog(): ChangelogEntry {
  return changelog[0];
}

// Check if the user has seen the current version
export function hasSeenCurrentVersion(): boolean {
  if (typeof window === "undefined") return true;
  const seen = localStorage.getItem(SEEN_VERSION_KEY);
  return seen === CURRENT_VERSION;
}

// Check if this is a returning user (has used the app before)
// We don't show "What's New" to brand new users
export function isReturningUser(): boolean {
  if (typeof window === "undefined") return false;
  const seen = localStorage.getItem(SEEN_VERSION_KEY);
  // If they've never had a version stored, check if they have sessions
  if (seen === null) {
    const sessions = localStorage.getItem("mindmate_sessions");
    return sessions !== null && JSON.parse(sessions).length > 0;
  }
  return true;
}

// Mark the current version as seen
export function markVersionSeen(): void {
  localStorage.setItem(SEEN_VERSION_KEY, CURRENT_VERSION);
}

// Should we show the "What's New" card?
export function shouldShowWhatsNew(): boolean {
  return isReturningUser() && !hasSeenCurrentVersion();
}
