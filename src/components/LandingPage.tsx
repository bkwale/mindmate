"use client";

import { useState, useEffect, useCallback } from "react";
import { SessionMode } from "@/lib/prompts";
import { saveProfile } from "@/lib/storage";
import { restoreFromBackup } from "@/lib/sync";
import { trackEvent } from "@/lib/cohort";

interface LandingPageProps {
  onStartSession: (mode: SessionMode) => void;
}

// The sample exchange that shows what MindM8 actually does
const sampleExchange = [
  { role: "assistant" as const, text: "What’s been on your mind that you haven’t said out loud?" },
  { role: "user" as const, text: "I keep replaying a conversation with my manager. I didn’t say what I needed to." },
  { role: "assistant" as const, text: "What did you need them to hear?" },
];

const doors = [
  {
    mode: "reflect" as SessionMode,
    title: "Arrive clearer",
    description: "Process something you’re carrying.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    mode: "prepare" as SessionMode,
    title: "Arrive ready",
    description: "Clarify what you need to say.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    mode: "ground" as SessionMode,
    title: "Arrive present",
    description: "Slow down. Name one feeling.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 6v6" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    mode: "breathe" as SessionMode,
    title: "Just be here",
    description: "No words. Just guided breathing.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
];

export default function LandingPage({ onStartSession }: LandingPageProps) {
  // Animation state for sample exchange
  const [visibleMessages, setVisibleMessages] = useState(0);

  // Gate modal state
  const [showGate, setShowGate] = useState(false);
  const [gateStep, setGateStep] = useState<"age" | "crisis">("age");
  const [pendingMode, setPendingMode] = useState<SessionMode | null>(null);

  // Restore state
  const [showRestore, setShowRestore] = useState(false);
  const [restorePhrase, setRestorePhrase] = useState("");
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "loading" | "error">("idle");
  const [restoreError, setRestoreError] = useState("");

  // Track landing page view
  useEffect(() => {
    trackEvent("onboarding_viewed");
  }, []);

  // Animate the sample exchange in one by one
  useEffect(() => {
    if (visibleMessages < sampleExchange.length) {
      const delay = visibleMessages === 0 ? 800 : 1200;
      const timer = setTimeout(() => {
        setVisibleMessages(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [visibleMessages]);

  const handleDoorTap = useCallback((mode: SessionMode) => {
    setPendingMode(mode);
    setShowGate(true);
    setGateStep("age");
  }, []);

  const handleAgeConfirm = () => {
    trackEvent("age_gate_passed");
    setGateStep("crisis");
  };

  const handleAgeReject = () => {
    alert("MindM8 is only available to users aged 18 and above. Please come back when you’re old enough.");
    setShowGate(false);
    setPendingMode(null);
  };

  const handleCrisisAccept = () => {
    trackEvent("crisis_accepted");
    saveProfile({
      name: "",
      onboarded: true,
      onboardedV2: true,
      seedAnswers: {},
      createdAt: new Date().toISOString(),
    });
    if (pendingMode) {
      onStartSession(pendingMode);
    }
  };

  return (
    <div className="min-h-screen bg-alpine flex flex-col relative overflow-hidden">
      <div className="mist-layer" style={{ top: "-60px", right: "-80px" }} />
      <div className="warm-glow" style={{ bottom: "10%", left: "-100px" }} />

      <main className="flex-1 px-6 py-12 max-w-md mx-auto w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="MindM8" width={44} height={44} />
          </div>
          <h1 className="text-3xl font-serif text-calm-text tracking-tight">
            MindM8
          </h1>
          <p className="text-lg text-calm-text/80 font-light leading-relaxed mt-2">
            Think more clearly about<br />
            what&apos;s weighing on you
          </p>
        </div>

        {/* Sample exchange — shows what the product does */}
        <div className="mb-6 space-y-3">
          {sampleExchange.slice(0, visibleMessages).map((msg, i) => (
            <div
              key={i}
              className={`animate-fade-in ${msg.role === "user" ? "pl-10" : "pr-10"}`}
            >
              {msg.role === "assistant" ? (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-mind-100/70 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-mind-400" />
                  </div>
                  <div className="bg-white/80 rounded-2xl rounded-tl-md px-3.5 py-2.5 border border-calm-border/50">
                    <p className="text-sm text-calm-text leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="bg-mind-600 rounded-2xl rounded-tr-md px-3.5 py-2.5">
                    <p className="text-sm text-white leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
          {visibleMessages < sampleExchange.length && (
            <div className="flex gap-2.5 animate-fade-in pr-10">
              <div className="w-6 h-6 rounded-full bg-mind-100 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-mind-400 animate-breathe" />
              </div>
              <div className="bg-white/80 rounded-2xl rounded-tl-md px-3.5 py-2.5 border border-calm-border/50">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-calm-muted/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-calm-muted/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-calm-muted/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex gap-2 mb-8 justify-center">
          <div className="flex items-center gap-1.5 bg-white/60 border border-calm-border/40 rounded-full px-3 py-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mind-500">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-[11px] text-calm-text font-medium">No sign-up</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/60 border border-calm-border/40 rounded-full px-3 py-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mind-500">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-[11px] text-calm-text font-medium">Stays on your device</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/60 border border-calm-border/40 rounded-full px-3 py-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mind-500">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-[11px] text-calm-text font-medium">5 min sessions</span>
          </div>
        </div>

        {/* Session mode doors */}
        <div className="space-y-2.5 mb-8">
          <p className="text-xs text-calm-muted text-center mb-3 font-medium uppercase tracking-wider">
            Choose how to arrive
          </p>
          {doors.map((door) => (
            <button
              key={door.mode}
              onClick={() => handleDoorTap(door.mode)}
              className="w-full text-left card-serene p-4 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="text-mind-400 group-hover:text-mind-500 transition-colors">
                  {door.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-calm-text group-hover:text-mind-700 transition-colors">
                    {door.title}
                  </h3>
                  <p className="text-xs text-calm-muted mt-0.5 font-light">
                    {door.description}
                  </p>
                </div>
                <div className="text-calm-border group-hover:text-mind-400 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Restore from backup link */}
        <div className="text-center">
          {!showRestore ? (
            <button
              onClick={() => setShowRestore(true)}
              className="text-xs text-calm-muted hover:text-mind-600 transition-colors"
            >
              Restoring from another device?
            </button>
          ) : (
            <div className="bg-white/80 rounded-xl p-4 border border-calm-border space-y-3 text-left animate-fade-in">
              <p className="text-sm text-calm-text font-medium">Restore your data</p>
              <p className="text-xs text-calm-muted">Enter the passphrase you used to back up.</p>
              {restoreStatus === "error" && (
                <p className="text-xs text-red-600">{restoreError}</p>
              )}
              <input
                type="password"
                value={restorePhrase}
                onChange={e => setRestorePhrase(e.target.value)}
                placeholder="Your passphrase"
                className="w-full px-4 py-3 rounded-xl border border-calm-border text-sm text-calm-text
                           placeholder:text-calm-muted/50 focus:outline-none focus:border-mind-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (restorePhrase.length < 8) return;
                    setRestoreStatus("loading");
                    setRestoreError("");
                    const result = await restoreFromBackup(restorePhrase, "overwrite");
                    if (result.success) {
                      window.location.reload();
                    } else {
                      setRestoreStatus("error");
                      setRestoreError(result.error || "Restore failed");
                    }
                  }}
                  disabled={restorePhrase.length < 8 || restoreStatus === "loading"}
                  className="flex-1 py-2.5 bg-mind-600 text-white rounded-xl text-xs font-medium
                             hover:bg-mind-700 transition-colors disabled:opacity-40"
                >
                  {restoreStatus === "loading" ? "Restoring..." : "Restore"}
                </button>
                <button
                  onClick={() => {
                    setShowRestore(false);
                    setRestorePhrase("");
                    setRestoreStatus("idle");
                    setRestoreError("");
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs text-calm-muted border border-calm-border
                             hover:bg-warm-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-calm-muted/50 mt-8 font-light tracking-wide">
          Not therapy. Not a chatbot. A space to reflect.
        </p>
      </main>

      {/* Age gate + crisis disclaimer modal */}
      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-lg animate-slide-up">
            {gateStep === "age" ? (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="text-lg font-serif text-calm-text mb-1">
                    One quick thing
                  </h2>
                  <p className="text-sm text-calm-muted">
                    MindM8 is designed for adults.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-calm-text text-sm font-medium text-center">
                    Are you 18 or older?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAgeConfirm}
                      className="flex-1 py-3 bg-mind-600 text-white rounded-xl text-sm font-medium
                                 hover:bg-mind-700 transition-colors duration-200"
                    >
                      Yes, I&apos;m 18+
                    </button>
                    <button
                      onClick={handleAgeReject}
                      className="flex-1 py-3 border border-calm-border text-calm-muted rounded-xl text-sm
                                 hover:bg-warm-50 transition-colors duration-200"
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-warm-600 text-lg">&#9888;</span>
                  </div>
                  <h2 className="text-lg font-serif text-calm-text">
                    Before we begin
                  </h2>
                </div>
                <div className="space-y-4 text-left">
                  <p className="text-sm text-calm-muted leading-relaxed">
                    MindM8 is <strong className="text-calm-text">not</strong> a therapist or
                    crisis service. It&apos;s a reflection tool — it asks questions, it
                    doesn&apos;t give answers.
                  </p>
                  <div className="bg-warm-50 border border-warm-200 rounded-xl p-4">
                    <p className="text-sm text-warm-700 leading-relaxed">
                      If you&apos;re in crisis, please reach out:
                    </p>
                    <ul className="text-sm text-warm-700 mt-2 space-y-1">
                      <li>UK: Samaritans — 116 123</li>
                      <li>US: 988 Suicide &amp; Crisis Lifeline</li>
                      <li>International: findahelpline.com</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={handleCrisisAccept}
                  className="w-full py-3 bg-mind-600 text-white rounded-xl text-sm font-medium
                             hover:bg-mind-700 transition-colors duration-200"
                >
                  I understand
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
