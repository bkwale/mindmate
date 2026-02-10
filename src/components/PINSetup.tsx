"use client";

import { useState, useRef, useEffect } from "react";
import { setPIN, setRecoveryWords } from "@/lib/security";

interface PINSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
  isChange?: boolean; // true when changing PIN from Settings
}

type Step = "create" | "confirm" | "recovery";

export default function PINSetup({ onComplete, onSkip, isChange }: PINSetupProps) {
  const [step, setStep] = useState<Step>("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [recoveryWords, setRecoveryWords] = useState(["", "", ""]);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wordRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    if (step === "create" || step === "confirm") {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (step === "recovery") {
      setTimeout(() => wordRefs[0].current?.focus(), 100);
    }
  }, [step]);

  const handleInput = (value: string) => {
    setError("");
    const digits = value.replace(/\D/g, "").slice(0, 4);

    if (step === "create") {
      setPin(digits);
      if (digits.length === 4) {
        setTimeout(() => {
          setStep("confirm");
          setConfirmPin("");
        }, 200);
      }
    } else if (step === "confirm") {
      setConfirmPin(digits);
      if (digits.length === 4) {
        if (digits === pin) {
          // PINs match — save PIN, then move to recovery words
          setPIN(digits).then(() => {
            setStep("recovery");
          });
        } else {
          setError("PINs didn\u2019t match. Try again.");
          setTimeout(() => {
            setStep("create");
            setPin("");
            setConfirmPin("");
          }, 1000);
        }
      }
    }
  };

  const updateRecoveryWord = (index: number, value: string) => {
    const updated = [...recoveryWords];
    updated[index] = value;
    setRecoveryWords(updated);
  };

  const handleRecoveryWordKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (index < 2) {
        wordRefs[index + 1].current?.focus();
      }
    }
  };

  const recoveryComplete = recoveryWords.every(w => w.trim().length >= 2);

  const handleSaveRecovery = async () => {
    if (!recoveryComplete) return;
    setIsSaving(true);
    await setRecoveryWords(
      recoveryWords.map(w => w.trim()) as [string, string, string]
    );
    setIsSaving(false);
    onComplete();
  };

  const currentValue = step === "create" ? pin : confirmPin;

  // Recovery words screen — shown after PIN is confirmed
  if (step === "recovery") {
    return (
      <div className="min-h-screen bg-calm-bg flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6 animate-fade-in">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-mind-100 flex items-center justify-center mx-auto">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-mind-600">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2 className="text-xl font-serif text-calm-text">
              3 words that feel like yours
            </h2>
            <p className="text-calm-muted text-sm leading-relaxed">
              If you ever forget your PIN, these words will help you get back in. Choose feelings or words only you would know.
            </p>
          </div>

          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <input
                key={i}
                ref={wordRefs[i]}
                type="text"
                value={recoveryWords[i]}
                onChange={e => updateRecoveryWord(i, e.target.value)}
                onKeyDown={e => handleRecoveryWordKeyDown(i, e)}
                placeholder={
                  i === 0 ? "First word" : i === 1 ? "Second word" : "Third word"
                }
                className="w-full px-4 py-3 rounded-xl border border-calm-border bg-white text-center
                           text-sm text-calm-text placeholder:text-calm-muted/30
                           focus:outline-none focus:border-mind-400 transition-colors"
                autoComplete="off"
                autoCapitalize="off"
              />
            ))}
          </div>

          <div className="bg-mind-50/60 border border-mind-100/50 rounded-2xl px-4 py-3">
            <p className="text-xs text-mind-700 leading-relaxed">
              These are hashed and can&rsquo;t be read — not even by the app. You&rsquo;ll need to remember at least 2 of 3 to recover your account.
            </p>
          </div>

          <button
            onClick={handleSaveRecovery}
            disabled={!recoveryComplete || isSaving}
            className="w-full py-3 bg-mind-600 text-white rounded-xl text-sm font-medium
                       hover:bg-mind-700 transition-colors duration-200
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save and continue"}
          </button>

          {!isChange && (
            <button
              onClick={onComplete}
              className="w-full py-2 text-calm-muted text-xs hover:text-calm-text transition-colors"
            >
              Skip — I&rsquo;ll remember my PIN
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-calm-bg flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-full bg-mind-100 flex items-center justify-center mx-auto">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-mind-600">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-serif text-calm-text">
            {isChange
              ? "Set new PIN"
              : step === "create"
                ? "Protect your space"
                : "Confirm your PIN"}
          </h2>
          <p className="text-calm-muted text-sm leading-relaxed">
            {step === "create"
              ? "Choose a 4-digit PIN. This keeps your reflections private on this device."
              : "Enter the same PIN again to confirm."}
          </p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                i < currentValue.length
                  ? "bg-mind-600 scale-110"
                  : "bg-calm-border"
              }`}
            />
          ))}
        </div>

        {/* Hidden input to capture keyboard/numpad */}
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={currentValue}
          onChange={e => handleInput(e.target.value)}
          className="opacity-0 absolute -z-10 w-0 h-0"
          autoComplete="off"
        />

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => handleInput(currentValue + n.toString())}
              className="w-16 h-16 rounded-2xl bg-white border border-calm-border
                         text-xl font-medium text-calm-text
                         hover:bg-mind-50 hover:border-mind-300 active:bg-mind-100
                         transition-all duration-150 mx-auto"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleInput(currentValue + "0")}
            className="w-16 h-16 rounded-2xl bg-white border border-calm-border
                       text-xl font-medium text-calm-text
                       hover:bg-mind-50 hover:border-mind-300 active:bg-mind-100
                       transition-all duration-150 mx-auto"
          >
            0
          </button>
          <button
            onClick={() => handleInput(currentValue.slice(0, -1))}
            disabled={currentValue.length === 0}
            className="w-16 h-16 rounded-2xl flex items-center justify-center
                       text-calm-muted hover:text-calm-text
                       disabled:opacity-30 transition-all duration-150 mx-auto"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 animate-fade-in">{error}</p>
        )}

        {/* Skip option — only during onboarding */}
        {onSkip && !isChange && (
          <button
            onClick={onSkip}
            className="text-calm-muted text-xs hover:text-calm-text transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
