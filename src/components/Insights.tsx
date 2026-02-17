"use client";

import { getThemes, getSessions, getProfile, getUsageMetrics, getReadinessData, getAllPatterns, getCheckInClusters, ThemeEntry, SessionRecord, UsageMetrics, ReadinessData, PatternSignal } from "@/lib/storage";
import { getCohortMetrics, CohortMetrics } from "@/lib/cohort";
import { useState, useEffect } from "react";

interface InsightsProps {
  onBack: () => void;
  onSettings: () => void;
}

export default function Insights({ onBack, onSettings }: InsightsProps) {
  const [themes, setThemes] = useState<ThemeEntry[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [cohort, setCohort] = useState<CohortMetrics | null>(null);
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [patterns, setPatterns] = useState<PatternSignal[]>([]);
  const [clusters, setClusters] = useState<{ cluster: string; count: number; words: string[] }[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "patterns" | "journey" | "themes" | "history" | "metrics">("overview");
  const [selectedContext, setSelectedContext] = useState<string | null>(null);

  useEffect(() => {
    setThemes(getThemes());
    setSessions(getSessions());
    setMetrics(getUsageMetrics());
    setCohort(getCohortMetrics());
    setReadiness(getReadinessData());
    setPatterns(getAllPatterns());
    setClusters(getCheckInClusters());
  }, []);

  const totalSessions = sessions.length;
  const totalReflections = sessions.filter(s => s.mode === "reflect").length;
  const totalPreparations = sessions.filter(s => s.mode === "prepare").length;
  const totalGrounding = sessions.filter(s => s.mode === "ground").length;
  const totalBreathe = sessions.filter(s => s.mode === "breathe").length;

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

  // Journey data — group themes by relationship context for timeline
  const journeyContexts = (() => {
    const grouped: Record<string, ThemeEntry[]> = {};
    themes.forEach(t => {
      if (!grouped[t.context]) grouped[t.context] = [];
      grouped[t.context].push(t);
    });

    return Object.entries(grouped)
      .map(([context, contextThemes]) => {
        const sorted = [...contextThemes].sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const emotionFreq: Record<string, number> = {};
        contextThemes.forEach(t => {
          emotionFreq[t.emotion] = (emotionFreq[t.emotion] || 0) + 1;
        });
        const topEmotion = Object.entries(emotionFreq)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || "";

        return {
          context,
          label: contextLabels[context] || context,
          count: contextThemes.length,
          topEmotion,
          latestDate: sorted[0]?.date || "",
          themes: sorted,
        };
      })
      .sort((a, b) => b.count - a.count);
  })();

  const selectedJourney = selectedContext
    ? journeyContexts.find(j => j.context === selectedContext)
    : null;

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
          {(["overview", "patterns", "journey", "themes", "history", "metrics"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab !== "journey") setSelectedContext(null); }}
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
                  <div className="grid grid-cols-2 gap-3">
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
                    <div className="bg-white rounded-xl p-4 border border-calm-border text-center">
                      <p className="text-2xl font-medium text-calm-text">{totalBreathe}</p>
                      <p className="text-[10px] text-calm-muted mt-1">Breathing</p>
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

          {/* PATTERNS TAB */}
          {activeTab === "patterns" && (
            <div className="space-y-4 animate-fade-in">
              {patterns.length === 0 && clusters.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-mind-100 flex items-center justify-center mx-auto mb-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-mind-500">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <p className="text-calm-muted text-sm">
                    Patterns will emerge as you reflect more. Keep showing up.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-calm-muted">
                    What MindM8 has noticed — not labels, just patterns.
                  </p>

                  {/* Check-in clusters */}
                  {clusters.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-calm-border">
                      <p className="text-xs text-calm-muted mb-3">Your emotional landscape (from check-ins)</p>
                      <div className="space-y-2">
                        {clusters.map(c => (
                          <div key={c.cluster} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-calm-text capitalize w-20">{c.cluster}</span>
                            <div className="flex-1 h-2 bg-calm-border rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-mind-500 transition-all duration-500"
                                style={{ width: `${Math.min(c.count * 15, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-calm-muted w-16 text-right">
                              {c.words.join(", ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pattern signals */}
                  {patterns.map(pattern => (
                    <div
                      key={pattern.type}
                      className="bg-white rounded-xl p-4 border border-calm-border"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          pattern.strength > 0.6 ? "bg-amber-100" : "bg-mind-100"
                        }`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            pattern.strength > 0.6 ? "bg-amber-500" : "bg-mind-500"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-calm-text">
                            {pattern.label}
                          </p>
                          <p className="text-xs text-calm-muted mt-1 leading-relaxed">
                            {pattern.description}
                          </p>
                          {pattern.suggestion && (
                            <p className="text-xs text-mind-600 mt-2 font-light italic">
                              {pattern.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* JOURNEY TAB */}
          {activeTab === "journey" && (
            <div className="space-y-3 animate-fade-in">
              {!selectedContext ? (
                <>
                  {journeyContexts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-full bg-mind-100 flex items-center justify-center mx-auto mb-4">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-mind-500">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <p className="text-calm-muted text-sm">
                        Your emotional journey will unfold here as you reflect.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-calm-muted">
                        Tap a relationship to see your emotional journey over time.
                      </p>
                      {journeyContexts.map(j => (
                        <button
                          key={j.context}
                          onClick={() => setSelectedContext(j.context)}
                          className="w-full text-left bg-white rounded-xl p-4 border border-calm-border
                                     hover:border-mind-300 hover:bg-mind-50/30 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-mind-100 flex items-center justify-center">
                                <span className="text-mind-600 font-medium text-sm">
                                  {j.label.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-calm-text group-hover:text-mind-700 transition-colors">
                                  {j.label}
                                </p>
                                <p className="text-[10px] text-calm-muted mt-0.5">
                                  {j.count} {j.count === 1 ? "reflection" : "reflections"} · {j.topEmotion}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-calm-muted">
                                {formatDate(j.latestDate)}
                              </span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-calm-border group-hover:text-mind-400 transition-colors">
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </>
              ) : selectedJourney ? (
                <>
                  <button
                    onClick={() => setSelectedContext(null)}
                    className="flex items-center gap-2 text-calm-muted hover:text-calm-text transition-colors mb-1"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <span className="text-xs">All relationships</span>
                  </button>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-mind-100 flex items-center justify-center">
                      <span className="text-mind-600 font-medium text-lg">
                        {selectedJourney.label.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-base font-serif text-calm-text">{selectedJourney.label}</h2>
                      <p className="text-xs text-calm-muted">
                        {selectedJourney.count} {selectedJourney.count === 1 ? "reflection" : "reflections"} over time
                      </p>
                    </div>
                  </div>

                  {/* Emotion summary for this relationship */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(() => {
                      const freq: Record<string, number> = {};
                      selectedJourney.themes.forEach(t => {
                        freq[t.emotion] = (freq[t.emotion] || 0) + 1;
                      });
                      return Object.entries(freq)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([emotion, count]) => (
                          <span
                            key={emotion}
                            className={`px-2.5 py-1 rounded-full text-[10px] ${getEmotionColor(emotion)}`}
                          >
                            {emotion} ({count})
                          </span>
                        ));
                    })()}
                  </div>

                  {/* Timeline */}
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[7px] top-3 bottom-3 w-[2px] bg-mind-200 rounded-full" />

                    <div className="space-y-4">
                      {selectedJourney.themes.map((theme, idx) => (
                        <div key={theme.id} className="relative flex gap-4">
                          {/* Timeline dot */}
                          <div className="relative z-10 mt-1.5 flex-shrink-0">
                            <div className={`w-4 h-4 rounded-full border-2 border-white ${
                              idx === 0 ? "bg-mind-500" : "bg-mind-300"
                            }`} style={{ boxShadow: "0 0 0 2px rgba(77,144,138,0.2)" }} />
                          </div>

                          {/* Content card */}
                          <div className="flex-1 bg-white rounded-xl p-4 border border-calm-border">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${getEmotionColor(theme.emotion)}`}>
                                {theme.emotion}
                              </span>
                              <span className="text-[10px] text-calm-muted">
                                {formatDate(theme.date)}
                              </span>
                            </div>
                            <p className="text-sm text-calm-text leading-relaxed">
                              {theme.theme}
                            </p>
                            <p className="text-[10px] text-calm-muted mt-2 capitalize">
                              {theme.mode === "reflect" ? "Reflection" :
                               theme.mode === "prepare" ? "Preparation" :
                               theme.mode === "breathe" ? "Breathing" :
                               "Grounding"} session
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
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
                            session.mode === "breathe" ? "bg-blue-400" :
                            "bg-calm-muted"
                          }`} />
                          <p className="text-sm text-calm-text capitalize">
                            {session.mode === "reflect" ? "Reflection" :
                             session.mode === "prepare" ? "Preparation" :
                             session.mode === "breathe" ? "Breathing" :
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
                  {(["reflect", "prepare", "ground", "breathe"] as const).map(m => {
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
                              m === "breathe" ? "bg-blue-400" :
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

              {/* Readiness — post-session clarity signals */}
              {readiness && readiness.total > 0 && (
                <div className="bg-white rounded-xl p-4 border border-calm-border">
                  <p className="text-xs text-calm-muted mb-3">Readiness (last 14 days)</p>
                  <div className="space-y-2.5">
                    {([
                      { label: "Yes", value: readiness.yes, color: "bg-mind-500" },
                      { label: "A little", value: readiness.aLittle, color: "bg-mind-300" },
                      { label: "Not yet", value: readiness.notYet, color: "bg-warm-400" },
                    ] as const).map(row => {
                      const pct = readiness.total > 0
                        ? Math.round((row.value / readiness.total) * 100)
                        : 0;
                      return (
                        <div key={row.label} className="flex items-center gap-3">
                          <span className="text-xs text-calm-text w-14">{row.label}</span>
                          <div className="flex-1 h-2 bg-calm-border rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${row.color}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-calm-muted w-8 text-right">{row.value}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-calm-muted mt-3">
                    {readiness.total} {readiness.total === 1 ? "response" : "responses"} &middot; {
                      readiness.yes > readiness.aLittle && readiness.yes > readiness.notYet
                        ? "Mostly arriving clearer"
                        : readiness.aLittle >= readiness.yes && readiness.aLittle >= readiness.notYet
                        ? "Getting there, gradually"
                        : "Still finding the way"
                    }
                  </p>
                </div>
              )}

              {/* Cohort / Retention */}
              {cohort && (
                <div className="bg-white rounded-xl p-4 border border-calm-border">
                  <p className="text-xs text-calm-muted mb-3">Retention</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-calm-text">Current streak</span>
                      <span className="text-sm font-medium text-calm-text">{cohort.streakDays} {cohort.streakDays === 1 ? "day" : "days"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-calm-text">Active days</span>
                      <span className="text-sm font-medium text-calm-text">{cohort.uniqueActiveDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-calm-text">Check-in rate</span>
                      <span className="text-sm font-medium text-calm-text">{cohort.checkInRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-calm-text">Session completion</span>
                      <span className="text-sm font-medium text-calm-text">{cohort.sessionCompletionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-calm-text">Weekly sessions</span>
                      <span className="text-sm font-medium text-calm-text">{cohort.weeklySessionCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-calm-text">Returned within 7 days</span>
                      <span className="text-sm font-medium text-calm-text">{cohort.returnedWithin7Days ? "Yes" : "Not yet"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-calm-text">Days since first use</span>
                      <span className="text-sm font-medium text-calm-text">{cohort.daysSinceFirstUse}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
