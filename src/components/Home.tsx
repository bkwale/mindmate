"use client";

import { useState, useEffect } from "react";
import { SessionMode } from "@/lib/prompts";
import { recentSessionCount, getLastSession, getLastTheme, addCheckIn, getTodayCheckIn, getRecentCheckIns, getUnresolvedFollowUp, resolveFollowUp, dismissFollowUp, getOpenLoop, clearOpenLoop, getCheckInPattern, getRelatedTheme, getAllPatterns, PatternSignal } from "@/lib/storage";
import { trackEvent } from "@/lib/cohort";
import { shouldPromptInstall, snoozeInstallPrompt, hasNativeInstallPrompt, triggerInstallPrompt, isIOS, requestNotificationPermission, hasSeenNotificationPrompt, markNotificationPromptSeen, getNotificationPermission } from "@/lib/notifications";
import { shouldShowBackupNudge, dismissBackupNudge } from "@/lib/sync";
import { shouldShowWhatsNew, getLatestChangelog, markVersionSeen } from "@/lib/whatsnew";
import { doors } from "@/lib/doors";
import MicButton from "./MicButton";
import ContextualCard from "./ContextualCard";

interface HomeProps {
  onSelectMode: (mode: SessionMode) => void;
  onOpenInsights: () => void;
}

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

  // Pattern nudge — show top pattern signal on home
  const [topPattern, setTopPattern] = useState<PatternSignal | null>(null);
  useEffect(() => {
    const patterns = getAllPatterns();
    if (patterns.length > 0) {
      setTopPattern(patterns[0]);
    }
  }, []);

  // Backup nudge — shows after 2+ sessions if no backup configured
  const [showBackupNudge, setShowBackupNudge] = useState(shouldShowBackupNudge);

  // Install prompt state — persists until user actually installs
  const [showInstallPrompt, setShowInstallPrompt] = useState(shouldPromptInstall);
  const [promptReady, setPromptReady] = useState(hasNativeInstallPrompt);

  // Listen for the native install prompt to become available (fires async)
  useEffect(() => {
    const onReady = () => setPromptReady(true);
    const onInstalled = () => setShowInstallPrompt(false);
    window.addEventListener("pwa-prompt-ready", onReady);
    window.addEventListener("pwa-installed", onInstalled);
    return () => {
      window.removeEventListener("pwa-prompt-ready", onReady);
      window.removeEventListener("pwa-installed", onInstalled);
    };
  }, []);

  // Notification prompt state
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(
    todayCheckIn && !hasSeenNotificationPrompt() && getNotificationPermission() === "default"
  );

  // What's New state
  const [showWhatsNew, setShowWhatsNew] = useState(shouldShowWhatsNew);
  const latestChangelog = getLatestChangelog();

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
    clearOpenLoop();
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
        {/* Pause message — when user has reflected 3+ times today */}
        {showPauseMessage && (
          <div className="mb-6 bg-warm-100/60 border border-warm-200/50 rounded-2xl p-4 animate-fade-in backdrop-blur-sm">
            <p className="text-sm text-warm-700 leading-relaxed">
              You&apos;ve reflected a lot today. It might help to step away and come
              back to this later.
            </p>
          </div>
        )}

        {/* === DOORS — always first, always visible === */}
        <div className="space-y-3 mb-6">
          {(showPauseMessage ? doors.filter(d => d.mode === "breathe") : doors).map((door) => (
            <button
              key={door.mode}
              onClick={() => handleSelectModeWithCleanup(door.mode)}
              className="w-full text-left card-serene p-5 group min-h-[72px]"
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

        {/* === ONE CONTEXTUAL CARD — priority-based === */}
        {!showPauseMessage && (
          <ContextualCard
            unresolved={unresolved}
            followUpExpanded={followUpExpanded}
            followUpResponse={followUpResponse}
            setFollowUpResponse={setFollowUpResponse}
            handleFollowUpResolution={handleFollowUpResolution}
            handleFollowUpSave={handleFollowUpSave}
            openLoop={openLoop}
            handleRevisitOpenLoop={handleRevisitOpenLoop}
            todayCheckIn={todayCheckIn}
            checkInSubmitted={checkInSubmitted}
            checkInPattern={checkInPattern}
            relatedTheme={relatedTheme}
            handleSelectModeWithCleanup={handleSelectModeWithCleanup}
            checkInInput={checkInInput}
            setCheckInInput={setCheckInInput}
            checkInError={checkInError}
            setCheckInError={setCheckInError}
            handleCheckInSubmit={handleCheckInSubmit}
            recentCheckIns={recentCheckIns}
            getDayLabel={getDayLabel}
            topPattern={topPattern}
            lastTheme={lastTheme}
            lastSession={lastSession}
            getTimeAgo={getTimeAgo}
          />
        )}

        {/* === SYSTEM CARDS — demoted below doors, max one shown === */}
        {!showPauseMessage && (() => {
          if (showWhatsNew) return (
            <div className="mb-5 card-serene p-5 animate-fade-in border border-mind-300/40 bg-gradient-to-br from-mind-50/80 to-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-mind-500">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <p className="text-xs text-mind-600 font-semibold uppercase tracking-wider">What&apos;s new</p>
                </div>
                <button onClick={() => { markVersionSeen(); setShowWhatsNew(false); }}
                  className="text-calm-muted hover:text-calm-text transition-colors flex-shrink-0" aria-label="Dismiss">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <p className="text-sm font-medium text-calm-text mb-2">{latestChangelog.title}</p>
              <div className="space-y-1.5">
                {latestChangelog.highlights.map((h, i) => (
                  <p key={i} className="text-xs text-calm-muted leading-relaxed flex gap-2">
                    <span className="text-mind-400 mt-0.5 flex-shrink-0">&middot;</span>
                    <span>{h}</span>
                  </p>
                ))}
              </div>
            </div>
          );

          if (showBackupNudge) return (
            <div className="mb-5 card-serene p-4 animate-fade-in border border-warm-300/60 bg-gradient-to-br from-warm-50/60 to-white">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-warm-600">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-calm-text">Protect your reflections</p>
                  <p className="text-xs text-calm-muted mt-1 leading-relaxed">Set up a passphrase in Settings so you never lose your sessions.</p>
                </div>
                <button onClick={() => { dismissBackupNudge(); setShowBackupNudge(false); }}
                  className="text-calm-muted hover:text-calm-text transition-colors flex-shrink-0 mt-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Dismiss">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          );

          if (showInstallPrompt) return (
            <div className="mb-5 card-serene p-4 animate-fade-in border border-mind-300/40 bg-gradient-to-br from-mind-50/60 to-white">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-mind-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-mind-600">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-calm-text">Add MindM8 to your home screen</p>
                  {isIOS() && !promptReady && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-calm-muted">
                        <span className="w-5 h-5 rounded-full bg-mind-100 text-mind-600 flex items-center justify-center font-medium text-[10px]">1</span>
                        <span>Tap the <strong>Share</strong> button at the bottom of Safari</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-calm-muted">
                        <span className="w-5 h-5 rounded-full bg-mind-100 text-mind-600 flex items-center justify-center font-medium text-[10px]">2</span>
                        <span>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></span>
                      </div>
                    </div>
                  )}
                  {!isIOS() && !promptReady && (
                    <p className="text-xs text-calm-muted mt-1">Tap <strong>Share</strong> then <strong>&ldquo;Add to Home Screen&rdquo;</strong></p>
                  )}
                </div>
                {promptReady && (
                  <button onClick={async () => { const accepted = await triggerInstallPrompt(); if (accepted) setShowInstallPrompt(false); }}
                    className="px-4 py-2 bg-mind-600 text-white rounded-xl text-sm font-medium hover:bg-mind-700 transition-colors duration-200 flex-shrink-0 min-h-[44px]">
                    Install
                  </button>
                )}
                <button onClick={() => { snoozeInstallPrompt(); setShowInstallPrompt(false); }}
                  className="text-calm-muted hover:text-calm-text transition-colors flex-shrink-0 mt-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Dismiss">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          );

          if (showNotificationPrompt) return (
            <div className="mb-5 card-serene p-4 animate-fade-in border border-mind-200/50">
              <p className="text-sm text-calm-text mb-3">Want a daily reminder to check in?</p>
              <div className="flex gap-2">
                <button onClick={handleNotificationYes}
                  className="flex-1 px-3 py-2 bg-mind-100 hover:bg-mind-200 text-mind-700 rounded-lg transition-colors text-sm font-medium min-h-[44px]">Yes</button>
                <button onClick={handleNotificationNo}
                  className="flex-1 px-3 py-2 bg-calm-border/30 hover:bg-calm-border/50 text-calm-text rounded-lg transition-colors text-sm font-medium min-h-[44px]">Not now</button>
              </div>
            </div>
          );

          return null;
        })()}

        {/* Footer */}
        <p className="text-center text-[11px] text-calm-muted/50 mt-10 font-light tracking-wide">
          Not therapy. Not a chatbot. A space to reflect.
        </p>
      </main>
    </div>
  );
}
