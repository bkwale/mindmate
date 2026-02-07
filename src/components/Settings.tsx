"use client";

import { getProfile, getThemes, getSessions, clearAllData } from "@/lib/storage";
import { useState, useEffect } from "react";

interface SettingsProps {
  onBack: () => void;
  onResetApp: () => void;
}

export default function Settings({ onBack, onResetApp }: SettingsProps) {
  const [name, setName] = useState("");
  const [themeCount, setThemeCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [joinedDate, setJoinedDate] = useState("");
  const [showConfirm, setShowConfirm] = useState<"themes" | "all" | null>(null);

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setName(profile.name);
      setJoinedDate(
        new Date(profile.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    }
    setThemeCount(getThemes().length);
    setSessionCount(getSessions().length);
  }, []);

  const handleClearThemes = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("mindmate_themes");
    setThemeCount(0);
    setShowConfirm(null);
  };

  const handleClearAll = () => {
    clearAllData();
    onResetApp();
  };

  return (
    <div className="min-h-screen bg-calm-bg flex flex-col">
      {/* Header */}
      <header className="pt-10 pb-4 px-6">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-calm-muted hover:text-calm-text transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-lg font-serif text-calm-text">Settings</h1>
        </div>
      </header>

      <main className="flex-1 px-6 pb-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-xl p-5 border border-calm-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-mind-100 flex items-center justify-center">
                <span className="text-mind-600 font-medium text-lg">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-base font-medium text-calm-text">{name}</p>
                <p className="text-xs text-calm-muted">Using MindMate since {joinedDate}</p>
              </div>
            </div>
          </div>

          {/* Data summary */}
          <div className="bg-white rounded-xl p-5 border border-calm-border">
            <p className="text-xs text-calm-muted mb-3 font-medium uppercase tracking-wider">
              Your data
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-calm-text">Sessions completed</span>
                <span className="text-sm text-calm-muted">{sessionCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-calm-text">Themes extracted</span>
                <span className="text-sm text-calm-muted">{themeCount}</span>
              </div>
            </div>
          </div>

          {/* Data controls */}
          <div className="bg-white rounded-xl p-5 border border-calm-border">
            <p className="text-xs text-calm-muted mb-3 font-medium uppercase tracking-wider">
              Data controls
            </p>
            <p className="text-xs text-calm-muted mb-4 leading-relaxed">
              Your data stays on this device. Nothing is sent to a server.
            </p>

            <div className="space-y-3">
              {/* Clear themes */}
              {showConfirm === "themes" ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800 mb-3">
                    Clear all {themeCount} extracted themes? Session history will be kept.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearThemes}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors"
                    >
                      Yes, clear themes
                    </button>
                    <button
                      onClick={() => setShowConfirm(null)}
                      className="px-4 py-2 bg-white text-calm-text rounded-lg text-xs font-medium border border-calm-border hover:border-calm-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm("themes")}
                  disabled={themeCount === 0}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm border border-calm-border
                             hover:border-amber-300 hover:bg-amber-50 transition-all
                             disabled:opacity-40 disabled:hover:border-calm-border disabled:hover:bg-white"
                >
                  <span className="text-calm-text">Clear extracted themes</span>
                  <p className="text-[10px] text-calm-muted mt-0.5">
                    Removes pattern data. Session history stays.
                  </p>
                </button>
              )}

              {/* Clear everything */}
              {showConfirm === "all" ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-800 mb-3">
                    This will delete everything — sessions, themes, and your profile. You&apos;ll start fresh.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearAll}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete everything
                    </button>
                    <button
                      onClick={() => setShowConfirm(null)}
                      className="px-4 py-2 bg-white text-calm-text rounded-lg text-xs font-medium border border-calm-border hover:border-calm-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm("all")}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm border border-red-200
                             hover:border-red-300 hover:bg-red-50 transition-all"
                >
                  <span className="text-red-600">Delete all data & reset</span>
                  <p className="text-[10px] text-calm-muted mt-0.5">
                    Removes everything. You&apos;ll go through onboarding again.
                  </p>
                </button>
              )}
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-xl p-5 border border-calm-border">
            <p className="text-xs text-calm-muted mb-3 font-medium uppercase tracking-wider">
              About MindMate
            </p>
            <p className="text-xs text-calm-muted leading-relaxed">
              MindMate is a space for emotional clarity. It helps you think through what you&apos;re
              feeling — not by giving advice, but by listening well and reflecting patterns back to you.
            </p>
            <p className="text-xs text-calm-muted leading-relaxed mt-2">
              Not therapy. Not a chatbot. A place to reflect.
            </p>
            <p className="text-[10px] text-calm-muted/50 mt-3">v1.0 — MVP</p>
          </div>
        </div>
      </main>
    </div>
  );
}
