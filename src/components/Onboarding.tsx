"use client";

import { useState } from "react";
import { saveProfile } from "@/lib/storage";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [screen, setScreen] = useState(0);
  const [seedAnswers, setSeedAnswers] = useState({
    relationship: "",
    feeling: "",
    conversation: "",
  });

  const handleFinish = () => {
    saveProfile({
      name: "",
      onboarded: true,
      seedAnswers,
      createdAt: new Date().toISOString(),
    });
    onComplete();
  };

  return (
    <div className="min-h-screen bg-calm-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full animate-fade-in">
        {screen === 0 && (
          <div className="text-center space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-serif text-calm-text tracking-tight">
                MindMate
              </h1>
              <div className="w-12 h-0.5 bg-mind-400 mx-auto rounded-full" />
            </div>
            <p className="text-calm-muted text-lg leading-relaxed">
              MindMate helps you think more clearly about your emotions and
              relationships. It&apos;s not therapy. It&apos;s not a chatbot.
              It&apos;s a space to reflect.
            </p>
            <button
              onClick={() => setScreen(1)}
              className="w-full py-3.5 bg-mind-600 text-white rounded-xl text-base font-medium
                         hover:bg-mind-700 transition-colors duration-200"
            >
              Continue
            </button>
          </div>
        )}

        {screen === 1 && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center mx-auto">
                <span className="text-warm-600 text-lg">⚠</span>
              </div>
              <h2 className="text-xl font-serif text-calm-text">
                Before we begin
              </h2>
            </div>
            <div className="space-y-4 text-left">
              <p className="text-calm-muted leading-relaxed">
                MindMate is <strong className="text-calm-text">not</strong> a therapist or
                crisis service. It&apos;s a reflection tool — it asks questions, it
                doesn&apos;t give answers.
              </p>
              <div className="bg-warm-50 border border-warm-200 rounded-xl p-4">
                <p className="text-sm text-warm-700 leading-relaxed">
                  If you&apos;re in crisis, please reach out:
                </p>
                <ul className="text-sm text-warm-700 mt-2 space-y-1">
                  <li>UK: Samaritans — 116 123</li>
                  <li>US: 988 Suicide & Crisis Lifeline</li>
                  <li>International: findahelpline.com</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setScreen(2)}
              className="w-full py-3.5 bg-mind-600 text-white rounded-xl text-base font-medium
                         hover:bg-mind-700 transition-colors duration-200"
            >
              I understand
            </button>
          </div>
        )}

        {screen === 2 && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-3">
              <h2 className="text-xl font-serif text-calm-text">
                What&apos;s on your mind?
              </h2>
              <p className="text-calm-muted text-sm">
                These are optional. Answer any, all, or none.
              </p>
            </div>
            <div className="space-y-5 text-left">
              <div>
                <label className="block text-sm text-calm-muted mb-2">
                  What relationship is most on your mind right now?
                </label>
                <input
                  type="text"
                  value={seedAnswers.relationship}
                  onChange={e =>
                    setSeedAnswers(s => ({ ...s, relationship: e.target.value }))
                  }
                  placeholder="e.g. my partner, my mother, a friend..."
                  className="w-full px-4 py-3 rounded-xl border border-calm-border bg-white
                             text-calm-text placeholder:text-calm-muted/50 text-sm
                             focus:outline-none focus:border-mind-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-calm-muted mb-2">
                  What&apos;s one feeling you&apos;ve been carrying this week?
                </label>
                <input
                  type="text"
                  value={seedAnswers.feeling}
                  onChange={e =>
                    setSeedAnswers(s => ({ ...s, feeling: e.target.value }))
                  }
                  placeholder="e.g. frustration, sadness, uncertainty..."
                  className="w-full px-4 py-3 rounded-xl border border-calm-border bg-white
                             text-calm-text placeholder:text-calm-muted/50 text-sm
                             focus:outline-none focus:border-mind-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-calm-muted mb-2">
                  Is there a conversation you&apos;ve been putting off?
                </label>
                <input
                  type="text"
                  value={seedAnswers.conversation}
                  onChange={e =>
                    setSeedAnswers(s => ({ ...s, conversation: e.target.value }))
                  }
                  placeholder="e.g. telling my boss I need a break..."
                  className="w-full px-4 py-3 rounded-xl border border-calm-border bg-white
                             text-calm-text placeholder:text-calm-muted/50 text-sm
                             focus:outline-none focus:border-mind-400 transition-colors"
                />
              </div>
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
