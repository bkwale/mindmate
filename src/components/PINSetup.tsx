"use client";

import { useState, useRef, useEffect } from "react";
import { setPIN } from "@/lib/security";

interface PINSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
  isChange?: boolean; // true when changing PIN from Settings
}

type Step = "create" | "confirm";

export default function PINSetup({ onComplete, onSkip, isChange }: PINSetupProps) {
  const [step, setStep] = useState<Step>("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Small delay to ensure DOM is ready
    setTimeout(() => inputRef.current?.focus(), 100);
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
    } else {
      setConfirmPin(digits);
      if (digits.length === 4) {
        if (digits === pin) {
          // PINs match — save and continue
          setPIN(digits).then(() => onComplete());
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

  const currentValue = step === "create" ? pin : confirmPin;

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
