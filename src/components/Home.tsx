"use client";

import { useState } from "react";
import { SessionMode } from "@/lib/prompts";
import { recentSessionCount, getLastSession, getLastTheme, addCheckIn, getTodayCheckIn, getRecentCheckIns, getUnresolvedFollowUp, resolveFollowUp, dismissFollowUp, getOpenLoop, clearOpenLoop, getCheckInPattern, getRelatedTheme } from "@/lib/storage";
import { trackEvent } from "@/lib/cohort";
import { shouldPromptInstall, dismissInstallPrompt, requestNotificationPermission, hasSeenNotificationPrompt, markNotificationPromptSeen, getNotificationPermission } from "@/lib/notifications";

interface HomeProps {
  onSelectMode: (mode: SessionMode) => void;
  onOpenInsights: () => void;
}

const doors = [
  {
    mode: "reflect" as SessionMode,
    title: "I need to think",
    description: "Process an emotion, an event, or something you can\u2019t name yet.",
    exchanges: "5 reflections",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    mode: "prepare" as SessionMode,
    title: "I need to prepare",
    description: "Clarify what you want to say before a difficult conversation.",
    exchanges: "7 reflections",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    mode: "ground" as SessionMode,
    title: "I just need a moment",
    description: "Slow down. Breathe. Name one feeling.",
    exchanges: "3 reflections",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 6v6" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
];

export default function Home({ onSelectMode, onOpenInsights }: HomeProps) {
  const recentCount = recentSessionCount();
  const showPauseMessage = recentCount >= 3;
  const lastSession = getLastSession();
  const lastTheme = getLastTheme();

  // Check-in feature state
  const [checkInInput, setCheckInInput] = useState("");
  const [checkInError, setCheckInError] = useState(false);
  const [checkInSubmitted, setCheckInSubmitted] = useState(false);
  const todayCheckIn = getTodayCheckIn();
  const recentCheckIns = getRecentCheckIns();
  const checkInPattern = checkInSubmitted ? getCheckInPattern() : null;
  const relatedTheme = todayCheckIn ? getRelatedTheme(todayCheckIn.word) : null;

  // Before & after follow-up feature state
  const [followUpResponse, setFollowUpResponse] = useState("");
  const [followUpExpanded, setFollowUpExpanded] = useState(false);
  const unresolved = getUnresolvedFollowUp();

  // Open loop state
  const openLoop = getOpenLoop();

  // Install prompt state
  const [showInstallPrompt, setShowInstallPrompt] = useState(shouldPromptInstall);

  // Notification prompt state
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(
    todayCheckIn && !hasSeenNotificationPrompt() && getNotificationPermission() === "default"
  );

  const handleCheckInSubmit = () => {
    const trimmed = checkInInput.trim();
    if (!trimmed) {
      setCheckInError(true);
      return;
    }
    if (trimmed.split(/\s+/).length > 1) {
      setCheckInError(true);
      return;
    }
    addCheckIn(trimmed);
    setCheckInInput("");
    setCheckInError(false);
    setCheckInSubmitted(true);
    trackEvent("checkin_complete");
  };

  const handleFollowUpResolution = (status: "yes" | "not-yet" | "changed-mind") => {
    if (status === "yes") {
      setFollowUpExpanded(true);
    } else if (status === "not-yet") {
      dismissFollowUp(unresolved!.id);
    } else if (status === "changed-mind") {
      dismissFollowUp(unresolved!.id);
    }
  };

  const handleFollowUpSave = () => {
    if (unresolved) {
      resolveFollowUp(unresolved.id, followUpResponse);
      setFollowUpResponse("");
      setFollowUpExpanded(false);
    }
  };

  const handleSelectModeWithCleanup = (mode: SessionMode) => {
    clearOpenLoop();
    onSelectMode(mode);
  };

  const handleNotificationYes = () => {
    requestNotificationPermission();
    markNotificationPromptSeen();
    setShowNotificationPrompt(false);
  };

  const handleNotificationNo = () => {
    markNotificationPromptSeen();
    setShowNotificationPrompt(false);
  };

  const handleRevisitOpenLoop = () => {
    clearOpenLoop();
    onSelectMode("reflect");
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return "last week";
    return `${weeks} weeks ago`;
  };

  const getDayLabel = (index: number) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return days[date.getDay()];
  };

  return (
    <div className="min-h-screen bg-alpine flex flex-col relative overflow-hidden">
      {/* Atmospheric mist layers */}
      <div className="mist-layer" style={{ top: "-60px", right: "-80px" }} />
      <div className="warm-glow" style={{ bottom: "10%", left: "-100px" }} />

      {/* Header */}
      <header className="pt-14 pb-8 px-6 relative z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="w-8" />
          <div className="text-center">
            <div className="flex justify-center mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="MindM8" width={40} height={40} />
            </div>
            <h1 className="text-2xl font-serif text-calm-text tracking-tight">
              MindM8
            </h1>
            <p className="text-calm-muted text-sm mt-3 font-light">
              What brings you here?
            </p>
          </div>
          <button
            onClick={onOpenInsights}
            className="text-calm-muted hover:text-mind-600 transition-colors p-1"
            aria-label="Your reflections"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 pb-8 max-w-md mx-auto w-full relative z-10 page-enter">
        {showPauseMessage && (
          <div className="mb-6 bg-warm-100/60 border border-warm-200/50 rounded-2xl p-4 animate-fade-in backdrop-blur-sm">
            <p className="text-sm text-warm-700 leading-relaxed">
              You&apos;ve reflected a lot today. It might help to step away and come
              back to this later.
            </p>
          </div>
        )}

        {/* One-word check-in card */}
        {!showPauseMessage && (
          <div className="mb-5 card-serene p-5 animate-fade-in">
            {todayCheckIn ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm text-calm-text font-medium">Today: <span className="text-mind-600 font-semibold">{todayCheckIn.word}</span></p>
                  <div className="w-1.5 h-1.5 rounded-full bg-mind-300" />
                </div>
                {recentCheckIns && recentCheckIns.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {recentCheckIns.map((checkIn, idx) => (
                      <div key={idx} className="text-xs bg-mind-50 text-mind-600 rounded-full px-3 py-1">
                        <span className="text-calm-muted">{getDayLabel(idx)}</span>: {checkIn.word}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <label className="text-sm text-calm-text font-medium block mb-3">
                  How are you feeling?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={checkInInput}
                    onChange={(e) => {
                      setCheckInInput(e.target.value);
                      setCheckInError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCheckInSubmit();
                      }
                    }}
                    placeholder="One word..."
                    className={`flex-1 bg-mind-50 border rounded-lg px-3 py-2 text-sm text-calm-text placeholder-calm-muted focus:outline-none transition-colors ${
                      checkInError
                        ? "border-warm-300 focus:border-warm-400"
                        : "border-mind-200 focus:border-mind-400"
                    }`}
                  />
                  <button
                    onClick={handleCheckInSubmit}
                    className="px-3 py-2 bg-mind-100 hover:bg-mind-200 text-mind-600 rounded-lg transition-colors text-sm font-medium"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                </div>
                {checkInError && (
                  <p className="text-xs text-warm-600 mt-2">Please enter a single word</p>
                )}
              </>
            )}
          </div>
        )}

        {/* Smart check-in response card */}
        {!showPauseMessage && todayCheckIn && checkInSubmitted && (
          <div className="mb-5 card-serene p-5 animate-fade-in border border-mind-200/50">
            <div className="space-y-3">
              {checkInPattern && (
                <div>
                  <p className="text-sm text-calm-text">
                    <span className="text-mind-600 font-semibold">{checkInPattern.count}</span> of your last <span className="text-mind-600 font-semibold">{checkInPattern.total}</span> check-ins were <span className="text-mind-600 font-semibold">{checkInPattern.word}</span>
                  </p>
                </div>
              )}
              {relatedTheme && (
                <div className="pt-2 border-t border-mind-100">
                  <p className="text-xs text-calm-muted mb-2">Last time, it was connected to:</p>
                  <p className="text-sm text-calm-text italic">{relatedTheme.theme}</p>
                </div>
              )}
              <div className="pt-2">
                <button
                  onClick={() => handleSelectModeWithCleanup("reflect")}
                  className="w-full px-3 py-2 bg-mind-100 hover:bg-mind-200 text-mind-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Sit with this?
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Open loop card */}
        {!showPauseMessage && openLoop && (
          <div className="mb-5 card-serene p-5 animate-fade-in border border-mind-200/50">
            <p className="text-xs text-calm-muted uppercase tracking-wider mb-3 font-medium">
              Something from last time...
            </p>
            <p className="text-sm text-calm-text italic mb-4 leading-relaxed">
              {openLoop.text}
            </p>
            <button
              onClick={handleRevisitOpenLoop}
              className="w-full px-3 py-2 bg-mind-100 hover:bg-mind-200 text-mind-700 rounded-lg transition-colors text-sm font-medium"
            >
              Revisit this
            </button>
          </div>
        )}

        {/* Before & after follow-up card */}
        {!showPauseMessage && unresolved && (
          <div className="mb-5 card-serene p-5 animate-fade-in">
            {!followUpExpanded ? (
              <>
                <p className="text-sm text-calm-text mb-4">
                  You were preparing for a conversation with <span className="font-semibold text-mind-600">{unresolved.person}</span>. Did it happen?
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      clearOpenLoop();
                      handleFollowUpResolution("yes");
                    }}
                    className="w-full px-3 py-2 bg-mind-100 hover:bg-mind-200 text-mind-700 rounded-lg transition-colors text-sm font-medium text-left"
                  >
                    Yes, it happened
                  </button>
                  <button
                    onClick={() => {
                      clearOpenLoop();
                      handleFollowUpResolution("not-yet");
                    }}
                    className="w-full px-3 py-2 bg-calm-border/30 hover:bg-calm-border/50 text-calm-text rounded-lg transition-colors text-sm font-medium text-left"
                  >
                    Not yet
                  </button>
                  <button
                    onClick={() => {
                      clearOpenLoop();
                      handleFollowUpResolution("changed-mind");
                    }}
                    className="w-full px-3 py-2 bg-calm-border/30 hover:bg-calm-border/50 text-calm-text rounded-lg transition-colors text-sm font-medium text-left"
                  >
                    I changed my mind
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-calm-text mb-3 font-medium">How did it go?</p>
                <textarea
                  value={followUpResponse}
                  onChange={(e) => setFollowUpResponse(e.target.value)}
                  placeholder="Share how the conversation went..."
                  className="w-full bg-mind-50 border border-mind-200 rounded-lg px-3 py-2 text-sm text-calm-text placeholder-calm-muted focus:outline-none focus:border-mind-400 transition-colors resize-none"
                  rows={4}
                />
                <button
                  onClick={handleFollowUpSave}
                  className="w-full mt-3 px-3 py-2 bg-mind-500 hover:bg-mind-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Save
                </button>
              </>
            )}
          </div>
        )}

        {/* Last reflection — connective tissue */}
        {lastTheme && lastSession && !showPauseMessage && (
          <div className="mb-5 card-serene p-4 animate-fade-in">
            <p className="text-[10px] text-calm-muted uppercase tracking-wider mb-2 font-medium">
              Last time you were here &middot; {getTimeAgo(lastSession.completedAt)}
            </p>
            <p className="text-sm text-calm-text leading-relaxed">
              {lastTheme.theme}
            </p>
            {lastSession.takeaway && (
              <p className="text-xs text-calm-muted mt-2 italic leading-relaxed">
                &ldquo;{lastSession.takeaway}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Add to homescreen banner */}
        {!showPauseMessage && showInstallPrompt && (
          <div className="mb-5 card-serene p-4 animate-fade-in border border-mind-200/50 flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-calm-text leading-relaxed">
                Add MindM8 to your home screen for easy access
              </p>
              <p className="text-xs text-calm-muted mt-2">
                Use your browser&apos;s menu and select &ldquo;Add to Home Screen&rdquo;
              </p>
            </div>
            <button
              onClick={() => {
                dismissInstallPrompt();
                setShowInstallPrompt(false);
              }}
              className="text-calm-muted hover:text-warm-600 transition-colors flex-shrink-0 mt-1"
              aria-label="Dismiss"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Notification permission prompt */}
        {!showPauseMessage && showNotificationPrompt && (
          <div className="mb-5 card-serene p-4 animate-fade-in border border-mind-200/50">
            <p className="text-sm text-calm-text mb-3">
              Want a daily reminder to check in?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleNotificationYes}
                className="flex-1 px-3 py-2 bg-mind-100 hover:bg-mind-200 text-mind-700 rounded-lg transition-colors text-sm font-medium"
              >
                Yes
              </button>
              <button
                onClick={handleNotificationNo}
                className="flex-1 px-3 py-2 bg-calm-border/30 hover:bg-calm-border/50 text-calm-text rounded-lg transition-colors text-sm font-medium"
              >
                Not now
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {doors.map((door) => (
            <button
              key={door.mode}
              onClick={() => handleSelectModeWithCleanup(door.mode)}
              className="w-full text-left card-serene p-5 group"
            >
              <div className="flex items-start gap-4">
                <div className="text-mind-400 group-hover:text-mind-500 transition-colors mt-0.5">
                  {door.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-calm-text group-hover:text-mind-700 transition-colors">
                    {door.title}
                  </h3>
                  <p className="text-sm text-calm-muted mt-1 leading-relaxed font-light">
                    {door.description}
                  </p>
                  <p className="text-xs text-mind-400 mt-2 font-medium">
                    {door.exchanges}
                  </p>
                </div>
                <div className="text-calm-border group-hover:text-mind-400 transition-colors mt-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-calm-muted/50 mt-10 font-light tracking-wide">
          Not therapy. Not a chatbot. A space to reflect.
        </p>
      </main>
    </div>
  );
}
