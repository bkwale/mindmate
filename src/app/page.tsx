"use client";

import { useState, useEffect } from "react";
import { isOnboarded } from "@/lib/storage";
import { isPINEnabled } from "@/lib/security";
import { SessionMode } from "@/lib/prompts";
import Onboarding from "@/components/Onboarding";
import Home from "@/components/Home";
import Session from "@/components/Session";
import Insights from "@/components/Insights";
import Settings from "@/components/Settings";
import PINLock from "@/components/PINLock";

type AppState = "loading" | "locked" | "onboarding" | "home" | "session" | "insights" | "settings";

export default function MindM8() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [activeMode, setActiveMode] = useState<SessionMode | null>(null);

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
  }, []);

  const handleOnboardingComplete = () => {
    setAppState("home");
  };

  const handleUnlock = () => {
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
      {appState === "session" && activeMode ? (
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
