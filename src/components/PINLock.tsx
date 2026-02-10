"use client";

import { useState, useRef, useEffect } from "react";
import { verifyPIN, resetAllData, hasRecoveryWords, verifyRecoveryWords, resetPINOnly } from "@/lib/security";

interface PINLockProps {
  onUnlock: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export default function PINLock({ onUnlock }: PINLockProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryWords, setRecoveryWords] = useState(["", "", ""]);
  const [recoveryError, setRecoveryError] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);
  const [showNewPIN, setShowNewPIN] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [newPinStep, setNewPinStep] = useState<"create" | "confirm">("create");
  const [newPinError, setNewPinError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const newPinRef = useRef<HTMLInputElement>(null);
  const wordRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Lockout countdown
  useEffect(() => {
    if (!lockoutEnd) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutEnd(null);
        setLockoutRemaining(0);
        setAttempts(0);
        setError("");
        setPin("");
        clearInterval(interval);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEnd]);

  const isLockedOut = lockoutEnd !== null && Date.now() < lockoutEnd;

  const handleInput = async (value: string) => {
    if (isLockedOut || isVerifying) return;
    setError("");
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setPin(digits);

    if (digits.length === 4) {
      setIsVerifying(true);
      const valid = await verifyPIN(digits);

      if (valid) {
        onUnlock();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockoutEnd(Date.now() + LOCKOUT_SECONDS * 1000);
          setError(`Too many attempts. Try again in ${LOCKOUT_SECONDS}s.`);
        } else {
          setError(`Wrong PIN. ${MAX_ATTEMPTS - newAttempts} attempts left.`);
        }
        setPin("");
      }
      setIsVerifying(false);
    }
  };

  const handleForgotPIN = () => {
    if (hasRecoveryWords()) {
      setShowRecovery(true);
    } else {
      setShowReset(true);
    }
  };

  const updateRecoveryWord = (index: number, value: string) => {
    const updated = [...recoveryWords];
    updated[index] = value;
    setRecoveryWords(updated);
    setRecoveryError("");
  };

  const handleRecoveryWordKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (index < 2) {
        wordRefs[index + 1].current?.focus();
      }
    }
  };

  const recoveryFilled = recoveryWords.every(w => w.trim().length >= 2);

  const handleVerifyRecovery = async () => {
    if (!recoveryFilled) return;
    setIsRecovering(true);
    setRecoveryError("");

    const valid = await verifyRecoveryWords(recoveryWords.map(w => w.trim()));

    if (valid) {
      // Recovery words matched — let them set a new PIN
      setShowRecovery(false);
      setShowNewPIN(true);
      setTimeout(() => newPinRef.current?.focus(), 100);
    } else {
      setRecoveryError("Those words didn\u2019t match. Try again, or reset everything below.");
    }
    setIsRecovering(false);
  };

  const handleNewPinInput = async (value: string) => {
    setNewPinError("");
    const digits = value.replace(/\D/g, "").slice(0, 4);

    if (newPinStep === "create") {
      setNewPin(digits);
      if (digits.length === 4) {
        setTimeout(() => {
          setNewPinStep("confirm");
          setConfirmNewPin("");
          setTimeout(() => newPinRef.current?.focus(), 100);
        }, 200);
      }
    } else {
      setConfirmNewPin(digits);
      if (digits.length === 4) {
        if (digits === newPin) {
          await resetPINOnly(digits);
          onUnlock();
        } else {
          setNewPinError("PINs didn\u2019t match. Try again.");
          setTimeout(() => {
            setNewPinStep("create");
            setNewPin("");
            setConfirmNewPin("");
          }, 1000);
        }
      }
    }
  };

  const handleNuclearReset = () => {
    resetAllData();
    window.location.reload();
  };

  const currentNewPin = newPinStep === "create" ? newPin : confirmNewPin;

  // New PIN screen — shown after successful recovery word verification
  if (showNewPIN) {
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
              {newPinStep === "create" ? "Set a new PIN" : "Confirm your PIN"}
            </h2>
            <p className="text-calm-muted text-sm">
              {newPinStep === "create"
                ? "Your words matched. Choose a new 4-digit PIN."
                : "Enter the same PIN again to confirm."}
            </p>
          </div>

          <div className="flex justify-center gap-4">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  i < currentNewPin.length
                    ? "bg-mind-600 scale-110"
                    : "bg-calm-border"
                }`}
              />
            ))}
          </div>

          <input
            ref={newPinRef}
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={currentNewPin}
            onChange={e => handleNewPinInput(e.target.value)}
            className="opacity-0 absolute -z-10 w-0 h-0"
            autoComplete="off"
          />

          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                onClick={() => handleNewPinInput(currentNewPin + n.toString())}
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
              onClick={() => handleNewPinInput(currentNewPin + "0")}
              className="w-16 h-16 rounded-2xl bg-white border border-calm-border
                         text-xl font-medium text-calm-text
                         hover:bg-mind-50 hover:border-mind-300 active:bg-mind-100
                         transition-all duration-150 mx-auto"
            >
              0
            </button>
            <button
              onClick={() => {
                if (newPinStep === "create") setNewPin(newPin.slice(0, -1));
                else setConfirmNewPin(confirmNewPin.slice(0, -1));
                setNewPinError("");
              }}
              disabled={currentNewPin.length === 0}
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

          {newPinError && (
            <p className="text-sm text-red-500 animate-fade-in">{newPinError}</p>
          )}
        </div>
      </div>
    );
  }

  // Recovery words screen — try to verify identity before resetting
  if (showRecovery) {
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
              Your 3 words
            </h2>
            <p className="text-calm-muted text-sm leading-relaxed">
              Enter the 3 words you chose when you set up your PIN. You need at least 2 correct to reset it.
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
                autoFocus={i === 0}
              />
            ))}
          </div>

          {recoveryError && (
            <p className="text-sm text-red-500 animate-fade-in">{recoveryError}</p>
          )}

          <button
            onClick={handleVerifyRecovery}
            disabled={!recoveryFilled || isRecovering}
            className="w-full py-3 bg-mind-600 text-white rounded-xl text-sm font-medium
                       hover:bg-mind-700 transition-colors duration-200
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isRecovering ? "Checking..." : "Verify my words"}
          </button>

          <div className="pt-2 border-t border-calm-border/50">
            <button
              onClick={() => { setShowRecovery(false); setShowReset(true); }}
              className="text-calm-muted text-xs hover:text-calm-text transition-colors"
            >
              I don&rsquo;t remember my words either
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nuclear reset confirmation screen
  if (showReset) {
    return (
      <div className="min-h-screen bg-calm-bg flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6 animate-fade-in">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-warm-600">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 className="text-xl font-serif text-calm-text">
              Reset everything?
            </h2>
            <p className="text-calm-muted text-sm leading-relaxed">
              Your reflections are stored only on this device. To protect your privacy, resetting your PIN will also clear all session data.
            </p>
            <p className="text-calm-muted text-sm font-medium">
              This can&rsquo;t be undone.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-calm-muted block">
              Type <span className="font-medium text-calm-text">RESET</span> to confirm
            </label>
            <input
              type="text"
              value={resetConfirmText}
              onChange={e => setResetConfirmText(e.target.value.toUpperCase())}
              placeholder="RESET"
              className="w-full px-4 py-3 rounded-xl border border-calm-border bg-white text-center
                         text-sm text-calm-text placeholder:text-calm-muted/30 tracking-widest
                         focus:outline-none focus:border-warm-400 transition-colors"
              autoFocus
            />
          </div>

          <button
            onClick={handleNuclearReset}
            disabled={resetConfirmText !== "RESET"}
            className="w-full py-3 bg-red-500 text-white rounded-xl text-sm font-medium
                       hover:bg-red-600 transition-colors duration-200
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Clear all data and start over
          </button>
          <button
            onClick={() => { setShowReset(false); setResetConfirmText(""); }}
            className="w-full py-2 text-calm-muted text-xs hover:text-calm-text transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-calm-bg flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-full bg-mind-100 flex items-center justify-center mx-auto">
            {isLockedOut ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-warm-600">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-mind-600">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </div>
          <h2 className="text-xl font-serif text-calm-text">
            {isLockedOut ? "Take a moment" : "Welcome back"}
          </h2>
          <p className="text-calm-muted text-sm">
            {isLockedOut
              ? `Try again in ${lockoutRemaining}s`
              : "Enter your PIN to continue"}
          </p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                error && pin.length === 0
                  ? "bg-red-300"
                  : i < pin.length
                    ? "bg-mind-600 scale-110"
                    : "bg-calm-border"
              }`}
            />
          ))}
        </div>

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pin}
          onChange={e => handleInput(e.target.value)}
          disabled={isLockedOut}
          className="opacity-0 absolute -z-10 w-0 h-0"
          autoComplete="off"
        />

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => handleInput(pin + n.toString())}
              disabled={isLockedOut || isVerifying}
              className="w-16 h-16 rounded-2xl bg-white border border-calm-border
                         text-xl font-medium text-calm-text
                         hover:bg-mind-50 hover:border-mind-300 active:bg-mind-100
                         transition-all duration-150 mx-auto
                         disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-calm-border"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleInput(pin + "0")}
            disabled={isLockedOut || isVerifying}
            className="w-16 h-16 rounded-2xl bg-white border border-calm-border
                       text-xl font-medium text-calm-text
                       hover:bg-mind-50 hover:border-mind-300 active:bg-mind-100
                       transition-all duration-150 mx-auto
                       disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-calm-border"
          >
            0
          </button>
          <button
            onClick={() => { setPin(pin.slice(0, -1)); setError(""); }}
            disabled={pin.length === 0 || isLockedOut || isVerifying}
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

        {/* Forgot PIN */}
        <button
          onClick={handleForgotPIN}
          className="text-calm-muted text-xs hover:text-calm-text transition-colors"
        >
          Forgot PIN?
        </button>
      </div>
    </div>
  );
}
