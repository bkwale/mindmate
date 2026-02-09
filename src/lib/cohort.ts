// ============================================================
// Anonymous Cohort Tracking — no personal data, retention metrics only
// ============================================================

export interface CohortEvent {
  event: string;
  timestamp: string;
  meta?: Record<string, string>;
}

const COHORT_KEY = "mindmate_cohort";

export function trackEvent(event: string, meta?: Record<string, string>): void {
  if (typeof window === "undefined") return;
  const events = getEvents();
  events.push({
    event,
    timestamp: new Date().toISOString(),
    meta,
  });
  // Keep last 90 days only
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const filtered = events.filter(e => new Date(e.timestamp).getTime() > cutoff);
  localStorage.setItem(COHORT_KEY, JSON.stringify(filtered));
}

export function getEvents(): CohortEvent[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(COHORT_KEY);
  return data ? JSON.parse(data) : [];
}

// ============================================================
// Cohort Metrics — the numbers investors want to see
// ============================================================

export interface CohortMetrics {
  totalAppOpens: number;
  uniqueActiveDays: number;
  checkInRate: number;
  sessionStartRate: number;
  sessionCompletionRate: number;
  returnedWithin7Days: boolean;
  daysSinceFirstUse: number;
  daysSinceLastUse: number;
  weeklySessionCount: number;
  streakDays: number;
  avgSessionsPerActiveDay: number;
}

export function getCohortMetrics(): CohortMetrics {
  const events = getEvents();

  const appOpens = events.filter(e => e.event === "app_open");
  const checkIns = events.filter(e => e.event === "checkin_complete");
  const sessionStarts = events.filter(e => e.event === "session_start");
  const sessionCompletes = events.filter(e => e.event === "session_complete");

  // Unique active days (any event)
  const activeDays = new Set(events.map(e => e.timestamp.slice(0, 10)));
  const uniqueActiveDays = activeDays.size;

  // Check-in rate: % of active days with at least one check-in
  const checkInDays = new Set(checkIns.map(e => e.timestamp.slice(0, 10)));
  const checkInRate = uniqueActiveDays > 0
    ? Math.round((checkInDays.size / uniqueActiveDays) * 100) : 0;

  // Session start rate: % of app opens that led to a session
  const sessionStartRate = appOpens.length > 0
    ? Math.round((sessionStarts.length / appOpens.length) * 100) : 0;

  // Session completion rate: % of started sessions that finished
  const sessionCompletionRate = sessionStarts.length > 0
    ? Math.round((sessionCompletes.length / sessionStarts.length) * 100) : 0;

  // Return within 7 days of first use
  const sortedDays = Array.from(activeDays).sort();
  const returnedWithin7Days = sortedDays.length >= 2 &&
    (new Date(sortedDays[1]).getTime() - new Date(sortedDays[0]).getTime())
      <= 7 * 24 * 60 * 60 * 1000;

  // Days since first/last use
  const first = sortedDays[0];
  const last = sortedDays[sortedDays.length - 1];
  const daysSinceFirstUse = first
    ? Math.floor((Date.now() - new Date(first).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const daysSinceLastUse = last
    ? Math.floor((Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Weekly session count (last 7 days)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklySessionCount = sessionCompletes.filter(e =>
    new Date(e.timestamp).getTime() > weekAgo
  ).length;

  // Current streak (consecutive days with any activity, counting back from today)
  let streakDays = 0;
  const checkDate = new Date();
  while (activeDays.has(checkDate.toISOString().slice(0, 10))) {
    streakDays++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Average sessions per active day
  const sessionDays = new Set(sessionCompletes.map(e => e.timestamp.slice(0, 10)));
  const avgSessionsPerActiveDay = sessionDays.size > 0
    ? Math.round((sessionCompletes.length / sessionDays.size) * 10) / 10 : 0;

  return {
    totalAppOpens: appOpens.length,
    uniqueActiveDays,
    checkInRate,
    sessionStartRate,
    sessionCompletionRate,
    returnedWithin7Days,
    daysSinceFirstUse,
    daysSinceLastUse,
    weeklySessionCount,
    streakDays,
    avgSessionsPerActiveDay,
  };
}
