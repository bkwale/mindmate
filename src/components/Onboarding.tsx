"use client";

import { useState } from "react";
import { saveProfile } from "@/lib/storage";
import PINSetup from "./PINSetup";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [screen, setScreen] = useState(0);
  const [aboutMe, setAboutMe] = useState("");

  const handleFinish = () => {
    saveProfile({
      name: "",
      onboarded: true,
      aboutMe: aboutMe.trim() || undefined,
      seedAnswers: {},
      createdAt: new Date().toISOString(),
    });
    onComplete();
  };

  // PIN setup gets its own full-screen layout
  if (screen === 3) {
    return (
      <PINSetup
        onComplete={() => setScreen(4)}
        onSkip={() => setScreen(4)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-alpine flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md w-full animate-fade-in">
        {/* Screen 0 — Landing: the emotional hook */}
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

            <button
              onClick={() => setScreen(1)}
              className="w-full py-3.5 bg-mind-600 text-white rounded-xl text-base font-medium
                         hover:bg-mind-700 transition-colors duration-200"
            >
              Begin
            </button>
          </div>
        )}

        {/* Screen 1 — Age gate: after they know what MindM8 is */}
        {screen === 1 && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="MindM8" width={48} height={48} />
            </div>
            <p className="text-calm-muted leading-relaxed">
              MindM8 explores emotions, relationships, and difficult
              conversations — topics that need maturity to engage with safely.
            </p>
            <p className="text-calm-text text-sm font-medium">
              Are you 18 or older?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setScreen(2)}
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
        )}

        {screen === 2 && (
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
              onClick={() => setScreen(3)}
              className="w-full py-3.5 bg-mind-600 text-white rounded-xl text-base font-medium
                         hover:bg-mind-700 transition-colors duration-200"
            >
              I understand
            </button>
          </div>
        )}

        {screen === 4 && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-3">
              <h2 className="text-xl font-serif text-calm-text">
                Help MindM8 understand you
              </h2>
              <p className="text-calm-muted text-sm leading-relaxed">
                What should MindM8 know about you? This helps it ask
                better questions from the start.
              </p>
            </div>
            <div className="text-left">
              <textarea
                value={aboutMe}
                onChange={e => setAboutMe(e.target.value)}
                placeholder={"e.g. I\u2019m going through a career change and struggling with a difficult relationship with my mum. I tend to overthink and avoid confrontation."}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-calm-border bg-white
                           text-calm-text placeholder:text-calm-muted/40 text-sm leading-relaxed
                           focus:outline-none focus:border-mind-400 transition-colors resize-none"
              />
              <p className="text-[10px] text-calm-muted mt-2">
                This stays on your device. You can change it anytime in Settings.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleFinish}
                className="flex-1 py-3.5 border border-calm-border text-calm-muted rounded-xl text-sm
                           hover:bg-warm-50 transition-colors duration-200"
              >
                Skip
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3.5 bg-mind-600 text-white rounded-xl text-sm font-medium
                           hover:bg-mind-700 transition-colors duration-200"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
