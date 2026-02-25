"use client";

import { useState, useEffect } from "react";

interface StatsData {
  totals: Record<string, number>;
  computed: {
    completionRate: number;
    totalSessions: number;
    totalCheckIns: number;
    totalVoice: number;
    totalBreatheSessions: number;
  };
  dailyData: Record<string, Record<string, number>>;
  dailyVisitors: Record<string, number>;
  hours: Record<string, number>;
  modes: Record<string, number>;
  geo: {
    countries: Record<string, number>;
    cities: Record<string, number>;
    regions: Record<string, number>;
  };
  recent: Array<{ e: string; t: string; m: string | null; g?: string }>;
  activeDates: string[];
  generatedAt: string;
}

export default function StatsPage() {
  const [token, setToken] = useState("");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  // Check URL param for token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      loadStats(t);
    }
  }, []);

  async function loadStats(t?: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/stats?token=${encodeURIComponent(t || token)}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError("Invalid token. Check your STATS_SECRET.");
          setAuthenticated(false);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to load stats");
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      setStats(data);
      setAuthenticated(true);
    } catch {
      setError("Could not connect to stats API");
    }
    setLoading(false);
  }

  // ---- Login screen ----
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
          <h1 className="text-xl font-semibold text-gray-800 mb-1">MindM8 Stats</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your admin token to view analytics</p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="STATS_SECRET token"
            className="w-full p-3 border border-gray-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
            onKeyDown={(e) => e.key === "Enter" && loadStats()}
          />
          <button
            onClick={() => loadStats()}
            disabled={loading || !token}
            className="w-full py-3 bg-teal-600 text-white rounded-xl font-medium text-sm hover:bg-teal-700 transition disabled:opacity-50"
          >
            {loading ? "Loading..." : "View Stats"}
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { totals, computed, dailyData, dailyVisitors, hours, modes, geo, recent, activeDates } = stats;

  // Get sorted dates for chart (last 14 days)
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

  // Max values for bar scaling
  const maxDailyEvents = Math.max(...last14.map(d => {
    const day = dailyData[d];
    return day ? Object.values(day).reduce((a, b) => a + b, 0) : 0;
  }), 1);

  const maxVisitors = Math.max(...last14.map(d => dailyVisitors[d] || 0), 1);

  // Hour distribution (0-23)
  const maxHour = Math.max(...Object.values(hours).map(Number), 1);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">MindM8 Analytics</h1>
            <p className="text-xs text-gray-400 mt-1">
              Anonymous usage data · Updated {new Date(stats.generatedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => loadStats()}
            className="text-sm px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition"
          >
            Refresh
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MetricCard label="Total Opens" value={totals.app_open || 0} />
          <MetricCard label="Sessions Started" value={totals.session_start || 0} />
          <MetricCard label="Sessions Completed" value={computed.totalSessions} />
          <MetricCard label="Completion Rate" value={`${computed.completionRate}%`} />
          <MetricCard label="Check-ins" value={computed.totalCheckIns} />
          <MetricCard label="Voice Uses" value={computed.totalVoice} />
        </div>

        {/* Mode Breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Session Modes</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "reflect", label: "Reflect", color: "bg-teal-500" },
              { key: "prepare", label: "Prepare", color: "bg-amber-500" },
              { key: "ground", label: "Ground", color: "bg-emerald-500" },
              { key: "breathe", label: "Breathe", color: "bg-blue-400" },
            ].map(m => (
              <div key={m.key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${m.color}`} />
                <span className="text-sm text-gray-600">{m.label}</span>
                <span className="text-sm font-medium text-gray-800 ml-auto">{modes[m.key] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Geography — Top Cities */}
        {geo && Object.keys(geo.cities).length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Top Cities</h2>
            <div className="space-y-2">
              {Object.entries(geo.cities)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 15)
                .map(([city, count]) => {
                  const maxCity = Math.max(...Object.values(geo.cities));
                  const pct = (count / maxCity) * 100;
                  return (
                    <div key={city} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-40 truncate" title={city}>{city}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-800 w-10 text-right">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Geography — Countries */}
        {geo && Object.keys(geo.countries).length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Countries</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(geo.countries)
                .sort(([, a], [, b]) => b - a)
                .map(([code, count]) => (
                  <div key={code} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-sm">{countryFlag(code)}</span>
                    <span className="text-sm text-gray-600">{code}</span>
                    <span className="text-sm font-medium text-gray-800 ml-auto">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Daily Activity Chart (last 14 days) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Daily Activity (14 days)</h2>
          <div className="flex items-end gap-1 h-32">
            {last14.map(d => {
              const day = dailyData[d];
              const total = day ? Object.values(day).reduce((a, b) => a + b, 0) : 0;
              const pct = (total / maxDailyEvents) * 100;
              return (
                <div key={d} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400">{total || ""}</span>
                  <div
                    className="w-full bg-teal-500 rounded-t transition-all duration-300"
                    style={{ height: `${Math.max(pct, total > 0 ? 4 : 0)}%` }}
                  />
                  <span className="text-[9px] text-gray-400 -rotate-45 origin-top-left mt-1">
                    {d.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Unique Visitors */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Unique Visitors (14 days)</h2>
          <div className="flex items-end gap-1 h-32">
            {last14.map(d => {
              const count = dailyVisitors[d] || 0;
              const pct = (count / maxVisitors) * 100;
              return (
                <div key={d} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400">{count || ""}</span>
                  <div
                    className="w-full bg-indigo-500 rounded-t transition-all duration-300"
                    style={{ height: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                  />
                  <span className="text-[9px] text-gray-400 -rotate-45 origin-top-left mt-1">
                    {d.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Time of Day (UTC)</h2>
          <div className="flex items-end gap-[2px] h-24">
            {Array.from({ length: 24 }, (_, h) => {
              const count = Number(hours[String(h)] || 0);
              const pct = (count / maxHour) * 100;
              return (
                <div key={h} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-amber-400 rounded-t transition-all duration-300"
                    style={{ height: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                    title={`${h}:00 — ${count} events`}
                  />
                  {h % 6 === 0 && (
                    <span className="text-[9px] text-gray-400 mt-1">{h}h</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Days (retention indicator) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Days</h2>
          <p className="text-2xl font-bold text-gray-800">{activeDates.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            Total unique days with at least one event
          </p>
          {activeDates.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              First: {activeDates[0]} · Latest: {activeDates[activeDates.length - 1]}
            </p>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400">No events yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recent.slice(0, 30).map((ev, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <EventDot event={ev.e} />
                  <span className="text-gray-700 font-medium">{formatEvent(ev.e)}</span>
                  {ev.m && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{ev.m}</span>}
                  {ev.g && <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">{ev.g}</span>}
                  <span className="text-xs text-gray-400 ml-auto">{timeAgo(ev.t)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <p className="text-center text-xs text-gray-300 pb-6">
          All data is anonymous. No personal information is collected or stored.
        </p>

      </div>
    </div>
  );
}

// ---- Helper Components ----

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function EventDot({ event }: { event: string }) {
  const colors: Record<string, string> = {
    app_open: "bg-gray-300",
    session_start: "bg-teal-400",
    session_complete: "bg-teal-600",
    checkin_complete: "bg-amber-400",
    voice_used: "bg-purple-400",
  };
  return <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[event] || "bg-gray-300"}`} />;
}

function formatEvent(event: string): string {
  const labels: Record<string, string> = {
    app_open: "App opened",
    session_start: "Session started",
    session_complete: "Session completed",
    checkin_complete: "Check-in",
    voice_used: "Voice input",
  };
  return labels[event] || event;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Convert 2-letter country code to flag emoji
function countryFlag(code: string): string {
  try {
    const upper = code.toUpperCase();
    if (upper.length !== 2) return "";
    return String.fromCodePoint(
      ...upper.split("").map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
    );
  } catch {
    return "";
  }
}
