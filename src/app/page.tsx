"use client";

import { useState, useEffect } from "react";
import { isOnboarded } from "@/lib/storage";
import { SessionMode } from "@/lib/prompts";
import Onboarding from "@/components/Onboarding";
import Home from "@/components/Home";
import Session from "@/components/Session";
import Insights from "@/components/Insights";
import Settings from "@/components/Settings";

type AppState = "loading" | "onboarding" | "home" | "session" | "insights" | "settings";

export default function MindMate() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [activeMode, setActiveMode] = useState<SessionMode | null>(null);

  useEffect(() => {
    // Check if user has completed onboarding
    const onboarded = isOnboarded();
    setAppState(onboarded ? "home" : "onboarding");
  }, []);

  const handleOnboardingComplete = () => {
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
      <div className="min-h-screen bg-calm-bg flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-mind-100 flex items-center justify-center mx-auto">
            <div className="w-3 h-3 rounded-full bg-mind-500 animate-breathe" />
          </div>
          <p className="text-sm text-calm-muted">MindMate</p>
        </div>
      </div>
    );
  }

  // Onboarding
  if (appState === "onboarding") {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Active session
  if (appState === "session" && activeMode) {
    return <Session mode={activeMode} onEnd={handleSessionEnd} />;
  }

  // Insights
  if (appState === "insights") {
    return <Insights onBack={handleBackToHome} onSettings={handleOpenSettings} />;
  }

  // Settings
  if (appState === "settings") {
    return <Settings onBack={handleBackToHome} onResetApp={handleResetApp} />;
  }

  // Home (three doors)
  return <Home onSelectMode={handleSelectMode} onOpenInsights={handleOpenInsights} />;
}
