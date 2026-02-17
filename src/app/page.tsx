"use client";

import { useState, useEffect, useCallback } from "react";
import { isOnboarded } from "@/lib/storage";
import { isPINEnabled, shouldAutoLock, updateLastActivity, getAutoLockTimeout } from "@/lib/security";
import { SessionMode } from "@/lib/prompts";
import { registerServiceWorker, initInstallPrompt } from "@/lib/notifications";
import { trackEvent } from "@/lib/cohort";
import Onboarding from "@/components/Onboarding";
import Home from "@/components/Home";
import Session from "@/components/Session";
import Breathe from "@/components/Breathe";
import Insights from "@/components/Insights";
import Settings from "@/components/Settings";
import PINLock from "@/components/PINLock";

type AppState = "loading" | "locked" | "onboarding" | "home" | "session" | "insights" | "settings";

export default function MindM8() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [activeMode, setActiveMode] = useState<SessionMode | null>(null);

  // Auto-lock: re-engage PIN when tab goes to background or user is idle
  const triggerLock = useCallback(() => {
    if (isPINEnabled() && appState !== "locked" && appState !== "loading" && appState !== "onboarding") {
      setAppState("locked");
    }
  }, [appState]);

  useEffect(() => {
    const onboarded = isOnboarded();
    if (!onboarded) {
      setAppState("onboarding");
      return;
    }

    // If onboarded and PIN is set, show lock screen
    if (isPINEnabled()) {
      setAppState("locked");
    } else {
      setAppState("home");
    }

    // Register service worker for PWA
    registerServiceWorker();

    // Capture the beforeinstallprompt event for native install
    initInstallPrompt();

    // Track app open
    trackEvent("app_open");
  }, []);

  // Visibility change listener — lock when tab goes to background
  useEffect(() => {
    if (appState === "loading" || appState === "onboarding" || appState === "locked") return;
    if (!isPINEnabled()) return;

    let hiddenAt: number | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab went to background — record when
        hiddenAt = Date.now();
        const timeout = getAutoLockTimeout();
        if (timeout === 0) {
          // Immediate lock on background
          triggerLock();
        }
      } else {
        // Tab came back — check if we should lock
        if (hiddenAt !== null) {
          const timeout = getAutoLockTimeout();
          if (timeout === -1) {
            // Never auto-lock
            hiddenAt = null;
            return;
          }
          const elapsed = Date.now() - hiddenAt;
          if (elapsed > timeout * 60 * 1000) {
            triggerLock();
          }
          hiddenAt = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [appState, triggerLock]);

  // Idle timer — check every 30s if user has been inactive past their timeout
  useEffect(() => {
    if (appState === "loading" || appState === "onboarding" || appState === "locked") return;
    if (!isPINEnabled()) return;
    const timeout = getAutoLockTimeout();
    if (timeout === -1 || timeout === 0) return; // skip for "never" and "immediate on background"

    // Track user activity
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
    const handleActivity = () => updateLastActivity();
    activityEvents.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));
    updateLastActivity(); // mark now as active

    // Periodic idle check
    const interval = setInterval(() => {
      if (shouldAutoLock()) {
        triggerLock();
      }
    }, 30000); // check every 30 seconds

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleActivity));
      clearInterval(interval);
    };
  }, [appState, triggerLock]);

  const handleOnboardingComplete = () => {
    setAppState("home");
  };

  const handleUnlock = () => {
    updateLastActivity(); // reset idle timer on unlock
    setAppState("home");
  };

  const handleSelectMode = (mode: SessionMode) => {
    setActiveMode(mode);
    setAppState("session");
  };

  const handleSessionEnd = () => {
    setActiveMode(null);
    setAppState("home");
  };

  const handleOpenInsights = () => {
    setAppState("insights");
  };

  const handleOpenSettings = () => {
    setAppState("settings");
  };

  const handleBackToHome = () => {
    setAppState("home");
  };

  const handleResetApp = () => {
    setAppState("onboarding");
  };

  // Loading state
  if (appState === "loading") {
    return (
      <div className="min-h-screen bg-thermal flex items-center justify-center relative overflow-hidden">
        <div className="mist-layer" style={{ top: "30%", left: "20%" }} />
        <div className="text-center space-y-4 animate-fade-in relative z-10">
          <div className="flex justify-center">
            <div className="meditation-circle" />
          </div>
          <p className="text-sm text-calm-muted font-light tracking-wide">MindM8</p>
        </div>
      </div>
    );
  }

  // PIN lock screen
  if (appState === "locked") {
    return <PINLock onUnlock={handleUnlock} />;
  }

  // Onboarding
  if (appState === "onboarding") {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Wrap all pages in a transition container
  return (
    <div key={appState} className="page-enter">
      {appState === "session" && activeMode === "breathe" ? (
        <Breathe onEnd={handleSessionEnd} />
      ) : appState === "session" && activeMode ? (
        <Session mode={activeMode} onEnd={handleSessionEnd} />
      ) : appState === "insights" ? (
        <Insights onBack={handleBackToHome} onSettings={handleOpenSettings} />
      ) : appState === "settings" ? (
        <Settings onBack={handleBackToHome} onResetApp={handleResetApp} />
      ) : (
        <Home onSelectMode={handleSelectMode} onOpenInsights={handleOpenInsights} />
      )}
    </div>
  );
}
