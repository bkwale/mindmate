"use client";

import { useState, useRef, useEffect } from "react";
import { verifyPIN } from "@/lib/security";

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
  const inputRef = useRef<HTMLInputElement>(null);

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
      </div>
    </div>
  );
}
