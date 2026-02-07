"use client";

import { getThemes, getSessions, getProfile, getUsageMetrics, ThemeEntry, SessionRecord, UsageMetrics } from "@/lib/storage";
import { useState, useEffect } from "react";

interface InsightsProps {
  onBack: () => void;
  onSettings: () => void;
}

export default function Insights({ onBack, onSettings }: InsightsProps) {
  const [themes, setThemes] = useState<ThemeEntry[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "themes" | "history" | "metrics">("overview");

  useEffect(() => {
    setThemes(getThemes());
    setSessions(getSessions());
    setMetrics(getUsageMetrics());
  }, []);

  const totalSessions = sessions.length;
  const totalReflections = sessions.filter(s => s.mode === "reflect").length;
  const totalPreparations = sessions.filter(s => s.mode === "prepare").length;
  const totalGrounding = sessions.filter(s => s.mode === "ground").length;

  // Emotion frequency
  const emotionCounts: Record<string, number> = {};
  themes.forEach(t => {
    emotionCounts[t.emotion] = (emotionCounts[t.emotion] || 0) + 1;
  });
  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Context frequency
  const contextCounts: Record<string, number> = {};
  themes.forEach(t => {
    contextCounts[t.context] = (contextCounts[t.context] || 0) + 1;
  });
  const topContexts = Object.entries(contextCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Recent themes (last 10)
  const recentThemes = [...themes].reverse().slice(0, 10);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const contextLabels: Record<string, string> = {
    partner: "Partner",
    "ex-partner": "Ex",
    family: "Family",
    child: "Child",
    work: "Work",
    friend: "Friend",
    self: "Self",
    general: "General",
  };

  const emotionColors: Record<string, string> = {
    anxiety: "bg-amber-100 text-amber-700",
    frustration: "bg-red-100 text-red-700",
    sadness: "bg-blue-100 text-blue-700",
    anger: "bg-red-100 text-red-700",
    confusion: "bg-purple-100 text-purple-700",
    overwhelm: "bg-orange-100 text-orange-700",
    guilt: "bg-rose-100 text-rose-700",
    loneliness: "bg-indigo-100 text-indigo-700",
    grief: "bg-slate-100 text-slate-700",
    relief: "bg-green-100 text-green-700",
    hope: "bg-emerald-100 text-emerald-700",
  };

  const getEmotionColor = (emotion: string) => {
    return emotionColors[emotion.toLowerCase()] || "bg-mind-100 text-mind-700";
  };

  return (
    <div className="min-h-screen bg-calm-bg flex flex-col">
      {/* Header */}
      <header className="pt-10 pb-4 px-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-calm-muted hover:text-calm-text transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-lg font-serif text-calm-text">Your Reflections</h1>
          <button
            onClick={onSettings}
            className="text-calm-muted hover:text-calm-text transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 mb-4">
        <div className="max-w-md mx-auto flex gap-1 bg-white rounded-xl p-1 border border-calm-border">
          {(["overview", "themes", "history", "metrics"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200
                ${activeTab === tab
                  ? "bg-mind-600 text-white"
                  : "text-calm-muted hover:text-calm-text"
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 pb-8">
        <div className="max-w-md mx-auto space-y-4">

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-4 animate-fade-in">
              {totalSessions === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-mind-100 flex items-center justify-center mx-auto mb-4">
                    <div className="w-3 h-3 rounded-full bg-mind-500" />
                  </div>
                  <p className="text-calm-muted text-sm">
                    Your reflections will appear here after your first session.
                  </p>
                </div>
              ) : (
                <>
                  {/* Session counts */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-4 border border-calm-border text-center">
                      <p className="text-2xl font-medium text-calm-text">{totalReflections}</p>
                      <p className="text-[10px] text-calm-muted mt-1">Reflections</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-calm-border text-center">
                      <p className="text-2xl font-medium text-calm-text">{totalPreparations}</p>
                      <p className="text-[10px] text-calm-muted mt-1">Preparations</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-calm-border text-center">
                      <p className="text-2xl font-medium text-calm-text">{totalGrounding}</p>
                      <p className="text-[10px] text-calm-muted mt-1">Grounding</p>
                    </div>
                  </div>

                  {/* Top emotions */}
                  {topEmotions.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-calm-border">
                      <p className="text-xs text-calm-muted mb-3">Emotions that come up most</p>
                      <div className="flex flex-wrap gap-2">
                        {topEmotions.map(([emotion, count]) => (
                          <span
                            key={emotion}
                            className={`px-3 py-1.5 rounded-full text-xs ${getEmotionColor(emotion)}`}
                          >
                            {emotion} <span className="opacity-60">({count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top contexts */}
                  {topContexts.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-calm-border">
                      <p className="text-xs text-calm-muted mb-3">Relationships you reflect on most</p>
                      <div className="flex flex-wrap gap-2">
                        {topContexts.map(([context, count]) => (
                          <span
                            key={context}
                            className="px-3 py-1.5 rounded-full text-xs bg-mind-100 text-mind-700"
                          >
                            {contextLabels[context] || context} <span className="opacity-60">({count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* THEMES TAB */}
          {activeTab === "themes" && (
            <div className="space-y-3 animate-fade-in">
              {recentThemes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-calm-muted text-sm">
                    Themes will appear here as you reflect.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-calm-muted">
                    What MindM8 has noticed across your reflections.
                  </p>
                  {recentThemes.map(theme => (
                    <div
                      key={theme.id}
                      className="bg-white rounded-xl p-4 border border-calm-border"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-calm-text leading-relaxed flex-1">
                          {theme.theme}
                        </p>
                        <span className="text-[10px] text-calm-muted whitespace-nowrap mt-0.5">
                          {formatDate(theme.date)}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${getEmotionColor(theme.emotion)}`}>
                          {theme.emotion}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-mind-100 text-mind-700">
                          {contextLabels[theme.context] || theme.context}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div className="space-y-3 animate-fade-in">
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-calm-muted text-sm">
                    Your session history will appear here.
                  </p>
                </div>
              ) : (
                <>
                  {[...sessions].reverse().map(session => (
                    <div
                      key={session.id}
                      className="bg-white rounded-xl p-4 border border-calm-border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            session.mode === "reflect" ? "bg-mind-500" :
                            session.mode === "prepare" ? "bg-warm-500" :
                            "bg-calm-muted"
                          }`} />
                          <p className="text-sm text-calm-text capitalize">
                            {session.mode === "reflect" ? "Reflection" :
                             session.mode === "prepare" ? "Preparation" :
                             "Grounding"}
                          </p>
                        </div>
                        <span className="text-[10px] text-calm-muted">
                          {formatDate(session.completedAt)}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-2">
                        <span className="text-[10px] text-calm-muted">
                          {session.exchanges} exchanges
                        </span>
                        {session.clarityResponse && session.clarityResponse !== "skip" && (
                          <span className={`text-[10px] ${
                            session.clarityResponse === "yes" ? "text-green-600" : "text-warm-600"
                          }`}>
                            {session.clarityResponse === "yes" ? "Felt clearer" : "Didn't help"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
          {/* METRICS TAB */}
          {activeTab === "metrics" && metrics && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs text-calm-muted">
                Anonymous usage data. No personal content.
              </p>

              {/* Key metrics grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 border border-calm-border">
                  <p className="text-2xl font-medium text-calm-text">{metrics.totalSessions}</p>
                  <p className="text-[10px] text-calm-muted mt-0.5">Total sessions</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-calm-border">
                  <p className="text-2xl font-medium text-calm-text">{metrics.completionRate}%</p>
                  <p className="text-[10px] text-calm-muted mt-0.5">Completion rate</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-calm-border">
                  <p className="text-2xl font-medium text-calm-text">{metrics.clarityRate}%</p>
                  <p className="text-[10px] text-calm-muted mt-0.5">Said &ldquo;that helped&rdquo;</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-calm-border">
                  <p className="text-2xl font-medium text-calm-text">{metrics.takeawayRate}%</p>
                  <p className="text-[10px] text-calm-muted mt-0.5">Wrote a takeaway</p>
                </div>
              </div>

              {/* Mode breakdown */}
              <div className="bg-white rounded-xl p-4 border border-calm-border">
                <p className="text-xs text-calm-muted mb-3">Sessions by mode</p>
                <div className="space-y-2">
                  {(["reflect", "prepare", "ground"] as const).map(m => {
                    const count = metrics.sessionsByMode[m];
                    const pct = metrics.totalSessions > 0
                      ? Math.round((count / metrics.totalSessions) * 100)
                      : 0;
                    return (
                      <div key={m} className="flex items-center gap-3">
                        <span className="text-xs text-calm-text w-16 capitalize">{m}</span>
                        <div className="flex-1 h-2 bg-calm-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              m === "reflect" ? "bg-mind-500" :
                              m === "prepare" ? "bg-warm-500" :
                              "bg-calm-muted"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-calm-muted w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Engagement */}
              <div className="bg-white rounded-xl p-4 border border-calm-border">
                <p className="text-xs text-calm-muted mb-3">Engagement</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-calm-text">Avg exchanges per session</span>
                    <span className="text-sm font-medium text-calm-text">{metrics.avgExchangesPerSession}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-calm-text">Multi-session day rate</span>
                    <span className="text-sm font-medium text-calm-text">{metrics.returnRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-calm-text">Themes extracted</span>
                    <span className="text-sm font-medium text-calm-text">{metrics.totalThemesExtracted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-calm-text">Days active</span>
                    <span className="text-sm font-medium text-calm-text">{metrics.daysSinceFirstSession}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
