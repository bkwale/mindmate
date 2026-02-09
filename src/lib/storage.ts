// MindM8 — Local Storage Helper (MVP)
// This will be replaced with a proper backend in production.

export interface UserProfile {
  name: string;
  onboarded: boolean;
  aboutMe?: string;
  seedAnswers: {
    relationship?: string;
    feeling?: string;
    conversation?: string;
  };
  createdAt: string;
}

// Get "about me" context for prompt injection
export function getAboutMe(): string | null {
  const profile = getProfile();
  if (!profile?.aboutMe || profile.aboutMe.trim().length === 0) return null;
  return profile.aboutMe.trim();
}

// Update just the aboutMe field
export function updateAboutMe(text: string): void {
  const profile = getProfile();
  if (!profile) return;
  profile.aboutMe = text;
  saveProfile(profile);
}

export interface ThemeEntry {
  id: string;
  emotion: string;
  context: string;
  theme: string;
  date: string;
  mode: string;
}

export interface SessionRecord {
  id: string;
  mode: string;
  exchanges: number;
  completedAt: string;
  clarityResponse?: "yes" | "no" | "skip";
  takeaway?: string;
  summary?: string;
}

// ============================================================
// Check-ins — one-word daily mood
// ============================================================

export interface CheckIn {
  word: string;
  timestamp: string;
}

// ============================================================
// Letters — letters you'll never send
// ============================================================

export interface Letter {
  id: string;
  to: string;
  content: string;
  createdAt: string;
}

// ============================================================
// Follow-ups — before & after for prepare sessions
// ============================================================

export interface FollowUp {
  id: string;
  person: string;
  createdAt: string;
  resolved: boolean;
  resolution?: string;
  resolvedAt?: string;
}

const KEYS = {
  profile: "mindmate_profile",
  themes: "mindmate_themes",
  sessions: "mindmate_sessions",
  checkins: "mindmate_checkins",
  letters: "mindmate_letters",
  followups: "mindmate_followups",
};

// Profile
export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(KEYS.profile);
  return data ? JSON.parse(data) : null;
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

export function isOnboarded(): boolean {
  const profile = getProfile();
  return profile?.onboarded ?? false;
}

// Themes (Tier 2 equivalent)
export function getThemes(): ThemeEntry[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KEYS.themes);
  return data ? JSON.parse(data) : [];
}

export function addTheme(theme: Omit<ThemeEntry, "id" | "date">): void {
  const themes = getThemes();
  themes.push({
    ...theme,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  });
  localStorage.setItem(KEYS.themes, JSON.stringify(themes));
}

// Sessions
export function getSessions(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KEYS.sessions);
  return data ? JSON.parse(data) : [];
}

export function addSession(session: Omit<SessionRecord, "id" | "completedAt">): void {
  const sessions = getSessions();
  sessions.push({
    ...session,
    id: crypto.randomUUID(),
    completedAt: new Date().toISOString(),
  });
  localStorage.setItem(KEYS.sessions, JSON.stringify(sessions));
}

// Recent session count (for the 3-session-in-2-hours limit)
export function recentSessionCount(): number {
  const sessions = getSessions();
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  return sessions.filter(s => new Date(s.completedAt).getTime() > twoHoursAgo).length;
}

// Get theme summaries for context injection
export function getThemeSummaries(): string[] {
  const themes = getThemes();
  if (themes.length === 0) return [];

  // Group by context and count
  const grouped: Record<string, { emotions: string[]; count: number; themes: string[] }> = {};
  themes.forEach(t => {
    if (!grouped[t.context]) {
      grouped[t.context] = { emotions: [], count: 0, themes: [] };
    }
    grouped[t.context].emotions.push(t.emotion);
    grouped[t.context].count++;
    grouped[t.context].themes.push(t.theme);
  });

  return Object.entries(grouped).map(([context, data]) => {
    const topEmotion = mode(data.emotions);
    return `${data.count} reflections tagged with "${context}" context. Most common emotion: ${topEmotion}.`;
  });
}

function mode(arr: string[]): string {
  const freq: Record<string, number> = {};
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "mixed";
}

// Get last session (for home screen context)
export function getLastSession(): SessionRecord | null {
  const sessions = getSessions();
  if (sessions.length === 0) return null;
  return sessions[sessions.length - 1];
}

// Get last theme (for home screen context)
export function getLastTheme(): ThemeEntry | null {
  const themes = getThemes();
  if (themes.length === 0) return null;
  return themes[themes.length - 1];
}

// ============================================================
// Check-ins
// ============================================================

export function getCheckIns(): CheckIn[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KEYS.checkins);
  return data ? JSON.parse(data) : [];
}

export function addCheckIn(word: string): void {
  const checkins = getCheckIns();
  checkins.push({ word: word.trim().toLowerCase(), timestamp: new Date().toISOString() });
  // Keep last 30 days only
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const filtered = checkins.filter(c => new Date(c.timestamp).getTime() > thirtyDaysAgo);
  localStorage.setItem(KEYS.checkins, JSON.stringify(filtered));
}

export function getTodayCheckIn(): CheckIn | null {
  const checkins = getCheckIns();
  const today = new Date().toISOString().slice(0, 10);
  return checkins.find(c => c.timestamp.slice(0, 10) === today) || null;
}

export function getRecentCheckIns(days: number = 7): CheckIn[] {
  const checkins = getCheckIns();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return checkins.filter(c => new Date(c.timestamp).getTime() > cutoff);
}

// ============================================================
// Letters
// ============================================================

export function getLetters(): Letter[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KEYS.letters);
  return data ? JSON.parse(data) : [];
}

export function addLetter(to: string, content: string): void {
  const letters = getLetters();
  letters.push({ id: crypto.randomUUID(), to, content, createdAt: new Date().toISOString() });
  localStorage.setItem(KEYS.letters, JSON.stringify(letters));
}

// ============================================================
// Follow-ups
// ============================================================

export function getFollowUps(): FollowUp[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KEYS.followups);
  return data ? JSON.parse(data) : [];
}

export function addFollowUp(person: string): void {
  const followups = getFollowUps();
  followups.push({
    id: crypto.randomUUID(),
    person,
    createdAt: new Date().toISOString(),
    resolved: false,
  });
  localStorage.setItem(KEYS.followups, JSON.stringify(followups));
}

export function getUnresolvedFollowUp(): FollowUp | null {
  const followups = getFollowUps();
  return followups.find(f => !f.resolved) || null;
}

export function resolveFollowUp(id: string, resolution: string): void {
  const followups = getFollowUps();
  const idx = followups.findIndex(f => f.id === id);
  if (idx >= 0) {
    followups[idx].resolved = true;
    followups[idx].resolution = resolution;
    followups[idx].resolvedAt = new Date().toISOString();
    localStorage.setItem(KEYS.followups, JSON.stringify(followups));
  }
}

export function dismissFollowUp(id: string): void {
  const followups = getFollowUps();
  const idx = followups.findIndex(f => f.id === id);
  if (idx >= 0) {
    followups[idx].resolved = true;
    followups[idx].resolution = "dismissed";
    followups[idx].resolvedAt = new Date().toISOString();
    localStorage.setItem(KEYS.followups, JSON.stringify(followups));
  }
}

// ============================================================
// Open Loops — seeds planted at session end, shown on next visit
// ============================================================

export interface OpenLoop {
  text: string;
  date: string;
  mode: string;
  context?: string;
}

export function saveOpenLoop(loop: OpenLoop): void {
  localStorage.setItem("mindmate_openloop", JSON.stringify(loop));
}

export function getOpenLoop(): OpenLoop | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("mindmate_openloop");
  return data ? JSON.parse(data) : null;
}

export function clearOpenLoop(): void {
  localStorage.removeItem("mindmate_openloop");
}

// ============================================================
// Smart Check-in Helpers — pattern detection for contextual responses
// ============================================================

export function getCheckInPattern(): { word: string; count: number; total: number } | null {
  const recent = getRecentCheckIns(7);
  if (recent.length < 2) return null;

  const freq: Record<string, number> = {};
  recent.forEach(c => {
    freq[c.word] = (freq[c.word] || 0) + 1;
  });

  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] < 2) return null;

  return { word: top[0], count: top[1], total: recent.length };
}

export function getRelatedTheme(word: string): ThemeEntry | null {
  const themes = getThemes();
  if (themes.length === 0) return null;
  // Find a theme whose emotion loosely matches the check-in word
  const match = [...themes].reverse().find(t =>
    t.emotion.toLowerCase().includes(word.toLowerCase()) ||
    word.toLowerCase().includes(t.emotion.toLowerCase())
  );
  return match || null;
}

// Clear all data
export function clearAllData(): void {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
  localStorage.removeItem("mindmate_openloop");
  localStorage.removeItem("mindmate_cohort");
}

// ============================================================
// Aggregate Metrics — anonymous, no personal data, investor-ready
// ============================================================

export interface UsageMetrics {
  totalSessions: number;
  sessionsByMode: { reflect: number; prepare: number; ground: number };
  completionRate: number; // % who finish all exchanges
  clarityRate: number; // % who said "that helped"
  avgExchangesPerSession: number;
  takeawayRate: number; // % who wrote a personal takeaway
  topEmotions: { emotion: string; count: number }[];
  topContexts: { context: string; count: number }[];
  returnRate: number; // % of days with >1 session (engagement)
  totalThemesExtracted: number;
  firstSessionDate: string | null;
  daysSinceFirstSession: number;
}

export function getUsageMetrics(): UsageMetrics {
  const sessions = getSessions();
  const themes = getThemes();

  const totalSessions = sessions.length;

  // Sessions by mode
  const sessionsByMode = { reflect: 0, prepare: 0, ground: 0 };
  sessions.forEach(s => {
    if (s.mode in sessionsByMode) {
      sessionsByMode[s.mode as keyof typeof sessionsByMode]++;
    }
  });

  // Average exchanges
  const avgExchangesPerSession =
    totalSessions > 0
      ? Math.round((sessions.reduce((sum, s) => sum + s.exchanges, 0) / totalSessions) * 10) / 10
      : 0;

  // Clarity rate (of those who responded, not skipped)
  const clarityResponses = sessions.filter(
    s => s.clarityResponse && s.clarityResponse !== "skip"
  );
  const clarityRate =
    clarityResponses.length > 0
      ? Math.round(
          (clarityResponses.filter(s => s.clarityResponse === "yes").length /
            clarityResponses.length) *
            100
        )
      : 0;

  // Completion rate (sessions where exchanges = max for that mode)
  const limits: Record<string, number> = { reflect: 5, prepare: 7, ground: 3 };
  const completedSessions = sessions.filter(
    s => s.exchanges >= (limits[s.mode] || 5)
  );
  const completionRate =
    totalSessions > 0
      ? Math.round((completedSessions.length / totalSessions) * 100)
      : 0;

  // Takeaway rate
  const takeawayRate =
    totalSessions > 0
      ? Math.round(
          (sessions.filter(s => s.takeaway && s.takeaway.trim().length > 0).length /
            totalSessions) *
            100
        )
      : 0;

  // Top emotions from themes
  const emotionCounts: Record<string, number> = {};
  themes.forEach(t => {
    emotionCounts[t.emotion] = (emotionCounts[t.emotion] || 0) + 1;
  });
  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emotion, count]) => ({ emotion, count }));

  // Top contexts
  const contextCounts: Record<string, number> = {};
  themes.forEach(t => {
    contextCounts[t.context] = (contextCounts[t.context] || 0) + 1;
  });
  const topContexts = Object.entries(contextCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([context, count]) => ({ context, count }));

  // Return rate: % of unique days with more than one session
  const sessionDays = new Set(
    sessions.map(s => new Date(s.completedAt).toISOString().slice(0, 10))
  );
  const multiSessionDays = new Set<string>();
  const dayCounts: Record<string, number> = {};
  sessions.forEach(s => {
    const day = new Date(s.completedAt).toISOString().slice(0, 10);
    dayCounts[day] = (dayCounts[day] || 0) + 1;
    if (dayCounts[day] > 1) multiSessionDays.add(day);
  });
  const returnRate =
    sessionDays.size > 0
      ? Math.round((multiSessionDays.size / sessionDays.size) * 100)
      : 0;

  // First session date
  const firstSessionDate =
    sessions.length > 0 ? sessions[0].completedAt : null;
  const daysSinceFirstSession = firstSessionDate
    ? Math.floor(
        (Date.now() - new Date(firstSessionDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return {
    totalSessions,
    sessionsByMode,
    completionRate,
    clarityRate,
    avgExchangesPerSession,
    takeawayRate,
    topEmotions,
    topContexts,
    returnRate,
    totalThemesExtracted: themes.length,
    firstSessionDate,
    daysSinceFirstSession,
  };
}
