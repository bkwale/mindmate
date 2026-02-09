"use client";

import { getProfile, getThemes, getSessions, clearAllData, updateAboutMe } from "@/lib/storage";
import { isPINEnabled, removePIN, getAutoLockTimeout, setAutoLockTimeout, LockTimeout } from "@/lib/security";
import { useState, useEffect } from "react";
import PINSetup from "./PINSetup";

interface SettingsProps {
  onBack: () => void;
  onResetApp: () => void;
}

export default function Settings({ onBack, onResetApp }: SettingsProps) {
  const [name, setName] = useState("");
  const [themeCount, setThemeCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [joinedDate, setJoinedDate] = useState("");
  const [showConfirm, setShowConfirm] = useState<"themes" | "all" | "pin" | null>(null);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [showPINSetup, setShowPINSetup] = useState(false);
  const [aboutMe, setAboutMe] = useState("");
  const [aboutMeSaved, setAboutMeSaved] = useState(false);
  const [lockTimeout, setLockTimeout] = useState<LockTimeout>(3);
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setName(profile.name);
      setAboutMe(profile.aboutMe || "");
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
    setPinEnabled(isPINEnabled());
    setLockTimeout(getAutoLockTimeout());
  }, []);

  const handleClearThemes = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("mindmate_themes");
    setThemeCount(0);
    setShowConfirm(null);
  };

  const handleClearAll = () => {
    clearAllData();
    removePIN();
    onResetApp();
  };

  const handleRemovePIN = () => {
    removePIN();
    setPinEnabled(false);
    setShowConfirm(null);
  };

  const handlePINSetupComplete = () => {
    setShowPINSetup(false);
    setPinEnabled(true);
  };

  // Show PIN setup as full-screen overlay
  if (showPINSetup) {
    return (
      <PINSetup
        onComplete={handlePINSetupComplete}
        isChange={pinEnabled}
      />
    );
  }

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
                  {name ? name.charAt(0).toUpperCase() : "M"}
                </span>
              </div>
              <div>
                <p className="text-base font-medium text-calm-text">{name || "MindM8 User"}</p>
                <p className="text-xs text-calm-muted">Using MindM8 since {joinedDate}</p>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-xl p-5 border border-calm-border">
            <p className="text-xs text-calm-muted mb-3 font-medium uppercase tracking-wider">
              Security
            </p>
            <p className="text-xs text-calm-muted mb-4 leading-relaxed">
              Protect your reflections with a PIN lock.
            </p>

            {pinEnabled ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span className="text-sm text-calm-text">PIN lock is on</span>
                  </div>
                  <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                </div>

                {/* Auto-lock timeout */}
                <div className="pt-2 border-t border-calm-border/50">
                  <p className="text-xs text-calm-muted mb-2">Auto-lock after</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {([
                      { value: 0 as LockTimeout, label: "Immediately" },
                      { value: 1 as LockTimeout, label: "1 min" },
                      { value: 3 as LockTimeout, label: "3 min" },
                      { value: 5 as LockTimeout, label: "5 min" },
                      { value: -1 as LockTimeout, label: "Never" },
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setLockTimeout(opt.value);
                          setAutoLockTimeout(opt.value);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          lockTimeout === opt.value
                            ? "bg-mind-600 text-white"
                            : "bg-white border border-calm-border text-calm-text hover:border-mind-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-calm-muted mt-2">
                    {lockTimeout === 0
                      ? "Locks the moment you leave the app or switch tabs."
                      : lockTimeout === -1
                      ? "Only locks when you close or refresh MindM8."
                      : `Locks after ${lockTimeout} ${lockTimeout === 1 ? "minute" : "minutes"} of inactivity or when you leave the app.`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPINSetup(true)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs text-calm-text border border-calm-border
                               hover:border-mind-300 hover:bg-mind-50 transition-all"
                  >
                    Change PIN
                  </button>

                  {showConfirm === "pin" ? (
                    <div className="flex-1 flex gap-1">
                      <button
                        onClick={handleRemovePIN}
                        className="flex-1 px-2 py-2.5 rounded-xl text-xs text-red-600 bg-red-50 border border-red-200
                                   hover:bg-red-100 transition-all"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowConfirm(null)}
                        className="flex-1 px-2 py-2.5 rounded-xl text-xs text-calm-muted border border-calm-border
                                   hover:bg-warm-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirm("pin")}
                      className="flex-1 px-4 py-2.5 rounded-xl text-xs text-red-500 border border-red-200
                                 hover:border-red-300 hover:bg-red-50 transition-all"
                    >
                      Remove PIN
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowPINSetup(true)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm border border-calm-border
                           hover:border-mind-300 hover:bg-mind-50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-mind-500">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="text-calm-text">Set up PIN lock</span>
                </div>
                <p className="text-[10px] text-calm-muted mt-0.5 ml-6">
                  Requires a 4-digit PIN each time you open MindM8.
                </p>
              </button>
            )}
          </div>

          {/* About you */}
          <div className="bg-white rounded-xl p-5 border border-calm-border">
            <p className="text-xs text-calm-muted mb-3 font-medium uppercase tracking-wider">
              About you
            </p>
            <p className="text-xs text-calm-muted mb-3 leading-relaxed">
              Help MindM8 understand you better. This context shapes how it asks questions.
            </p>
            <textarea
              value={aboutMe}
              onChange={(e) => {
                setAboutMe(e.target.value);
                setAboutMeSaved(false);
              }}
              placeholder="e.g. I'm going through a career change and struggling with a difficult relationship with my mum."
              className="w-full px-4 py-3 rounded-xl border border-calm-border text-sm text-calm-text
                         placeholder:text-calm-muted/50 focus:outline-none focus:border-mind-300
                         resize-none leading-relaxed"
              rows={3}
            />
            <button
              onClick={() => {
                updateAboutMe(aboutMe);
                setAboutMeSaved(true);
                setTimeout(() => setAboutMeSaved(false), 2000);
              }}
              className={`mt-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
                aboutMeSaved
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : "bg-mind-50 text-mind-600 border border-mind-200 hover:bg-mind-100"
              }`}
            >
              {aboutMeSaved ? "Saved ✓" : "Save"}
            </button>
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
                    This will delete everything — sessions, themes, your PIN, and your profile. You&apos;ll start fresh.
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
                  <span className="text-red-600">Delete all data &amp; reset</span>
                  <p className="text-[10px] text-calm-muted mt-0.5">
                    Removes everything. You&apos;ll go through onboarding again.
                  </p>
                </button>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-white rounded-xl p-5 border border-calm-border">
            <p className="text-xs text-calm-muted mb-3 font-medium uppercase tracking-wider">
              Feedback
            </p>
            <p className="text-xs text-calm-muted mb-3 leading-relaxed">
              Something you&apos;d change? Something that helped? I&apos;d love to hear it.
            </p>
            {feedbackSent ? (
              <div className="bg-mind-50 border border-mind-100 rounded-xl p-4 text-center">
                <p className="text-sm text-mind-700">Thank you for your feedback</p>
              </div>
            ) : (
              <>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="What would make MindM8 better for you?"
                  className="w-full px-4 py-3 rounded-xl border border-calm-border text-sm text-calm-text
                             placeholder:text-calm-muted/50 focus:outline-none focus:border-mind-300
                             resize-none leading-relaxed"
                  rows={3}
                />
                <button
                  onClick={async () => {
                    if (!feedback.trim()) return;
                    try {
                      const res = await fetch("/api/feedback", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ feedback: feedback.trim() }),
                      });
                      if (res.ok) {
                        setFeedbackSent(true);
                        setFeedback("");
                      }
                    } catch {
                      // Silent fail — still show thank you
                      setFeedbackSent(true);
                      setFeedback("");
                    }
                  }}
                  disabled={!feedback.trim()}
                  className="mt-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all
                             bg-mind-50 text-mind-600 border border-mind-200 hover:bg-mind-100
                             disabled:opacity-40 disabled:hover:bg-mind-50"
                >
                  Send feedback
                </button>
              </>
            )}
          </div>

          {/* About */}
          <div className="bg-white rounded-xl p-5 border border-calm-border">
            <p className="text-xs text-calm-muted mb-3 font-medium uppercase tracking-wider">
              About MindM8
            </p>
            <p className="text-xs text-calm-muted leading-relaxed">
              MindM8 is a space for emotional clarity. It helps you think through what you&apos;re
              feeling — not by giving advice, but by listening well and reflecting patterns back to you.
            </p>
            <p className="text-xs text-calm-muted leading-relaxed mt-2">
              Not therapy. Not a chatbot. A place to reflect.
            </p>
            <p className="text-[10px] text-calm-muted/50 mt-3">v1.3 — Arrival</p>
          </div>
        </div>
      </main>
    </div>
  );
}
