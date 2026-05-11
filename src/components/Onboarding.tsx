"use client";

import { useState, useEffect } from "react";
import { saveProfile } from "@/lib/storage";
import { restoreFromBackup } from "@/lib/sync";
import { trackEvent } from "@/lib/cohort";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [screen, setScreen] = useState(0);
  const [showRestore, setShowRestore] = useState(false);
  const [restorePhrase, setRestorePhrase] = useState("");
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "loading" | "error">("idle");
  const [restoreError, setRestoreError] = useState("");

  const handleFinish = () => {
    trackEvent("crisis_accepted");
    saveProfile({
      name: "",
      onboarded: true,
      onboardedV2: true,
      seedAnswers: {},
      createdAt: new Date().toISOString(),
    });
    onComplete();
  };

  // Track funnel events
  useEffect(() => {
    trackEvent("onboarding_viewed");
  }, []);

  return (
    <div className="min-h-screen bg-alpine flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md w-full animate-fade-in">
        {/* Screen 0 — Landing + Age Gate (merged) */}
        {screen === 0 && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="flex justify-center">
              <div className="meditation-circle" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-serif text-calm-text tracking-tight">
                MindM8
              </h1>
              <p className="text-lg text-calm-text/80 font-light leading-relaxed">
                A quiet space for the thoughts<br />
                you carry alone
              </p>
            </div>

            <p className="text-calm-muted leading-relaxed">
              MindM8 helps you think more clearly about your emotions and
              relationships. It&apos;s not therapy. It&apos;s not a chatbot.
              It&apos;s a space to reflect.
            </p>

            <div className="space-y-3">
              <p className="text-calm-text text-sm font-medium">
                Are you 18 or older?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    trackEvent("age_gate_passed");
                    setScreen(1);
                  }}
                  className="flex-1 py-3.5 bg-mind-600 text-white rounded-xl text-base font-medium
                             hover:bg-mind-700 transition-colors duration-200"
                >
                  Yes, I&apos;m 18+
                </button>
                <button
                  onClick={() => {
                    alert("MindM8 is only available to users aged 18 and above. Please come back when you\u2019re old enough.");
                  }}
                  className="flex-1 py-3.5 border border-calm-border text-calm-muted rounded-xl text-base
                             hover:bg-warm-50 transition-colors duration-200"
                >
                  No
                </button>
              </div>
            </div>

            {/* Restore from backup */}
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
        )}

        {/* Screen 1 — Crisis disclaimer */}
        {screen === 1 && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center mx-auto">
                <span className="text-warm-600 text-lg">&#9888;</span>
              </div>
              <h2 className="text-xl font-serif text-calm-text">
                Before we begin
              </h2>
            </div>
            <div className="space-y-4 text-left">
              <p className="text-calm-muted leading-relaxed">
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
              onClick={handleFinish}
              className="w-full py-3.5 bg-mind-600 text-white rounded-xl text-base font-medium
                         hover:bg-mind-700 transition-colors duration-200"
            >
              I understand
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
