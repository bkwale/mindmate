// MindMate — Local Storage Helper (MVP)
// This will be replaced with a proper backend in production.

export interface UserProfile {
  name: string;
  onboarded: boolean;
  seedAnswers: {
    relationship?: string;
    feeling?: string;
    conversation?: string;
  };
  createdAt: string;
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

const KEYS = {
  profile: "mindmate_profile",
  themes: "mindmate_themes",
  sessions: "mindmate_sessions",
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

// Clear all data
export function clearAllData(): void {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
