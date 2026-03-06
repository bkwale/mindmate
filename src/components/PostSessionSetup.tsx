"use client";

import { useState } from "react";
import { isPINEnabled } from "@/lib/security";
import { getAboutMe, updateAboutMe, setPostSessionSetupSeen } from "@/lib/storage";
import PINSetup from "./PINSetup";
import MicButton from "./MicButton";

interface PostSessionSetupProps {
  onComplete: () => void;
}

export default function PostSessionSetup({ onComplete }: PostSessionSetupProps) {
  const needsPIN = !isPINEnabled();
  const needsAboutMe = !getAboutMe();

  // Determine which step to start on
  const getInitialStep = (): "pin" | "aboutme" | "done" => {
    if (needsPIN) return "pin";
    if (needsAboutMe) return "aboutme";
    return "done";
  };

  const [step, setStep] = useState<"pin" | "aboutme" | "done">(getInitialStep);
  const [aboutMeText, setAboutMeText] = useState("");

  // If nothing to show, complete immediately
  if (step === "done" || (!needsPIN && !needsAboutMe)) {
    setPostSessionSetupSeen();
    onComplete();
    return null;
  }

  const handlePINComplete = () => {
    if (needsAboutMe) {
      setStep("aboutme");
    } else {
      setPostSessionSetupSeen();
      onComplete();
    }
  };

  const handlePINSkip = () => {
    if (needsAboutMe) {
      setStep("aboutme");
    } else {
      setPostSessionSetupSeen();
      onComplete();
    }
  };

  const handleAboutMeSave = () => {
    const trimmed = aboutMeText.trim();
    if (trimmed) {
      updateAboutMe(trimmed);
    }
    setPostSessionSetupSeen();
    onComplete();
  };

  const handleAboutMeSkip = () => {
    setPostSessionSetupSeen();
    onComplete();
  };

  return (
    <div className="min-h-screen bg-alpine flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md w-full animate-fade-in">
        {step === "pin" && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded-full bg-mind-100 flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-mind-600">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 className="text-xl font-serif text-calm-text">
                Protect your reflections?
              </h2>
              <p className="text-sm text-calm-muted mt-2 leading-relaxed">
                Add a PIN so only you can access your sessions.
              </p>
            </div>
            <PINSetup onComplete={handlePINComplete} onSkip={handlePINSkip} />
          </div>
        )}

        {step === "aboutme" && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-mind-100 flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-mind-600">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className="text-xl font-serif text-calm-text">
                Help MindM8 understand you
              </h2>
              <p className="text-sm text-calm-muted mt-2 leading-relaxed">
                Share a little about yourself so reflections feel more personal.
                This is optional and stays on your device.
              </p>
            </div>

            <div>
              <textarea
                value={aboutMeText}
                onChange={(e) => setAboutMeText(e.target.value)}
                placeholder="e.g. I'm a parent of two, working through a career change..."
                className="w-full bg-white border border-calm-border rounded-xl px-4 py-3 text-sm text-calm-text
                           placeholder:text-calm-muted/50 focus:outline-none focus:border-mind-300
                           transition-colors resize-none"
                rows={4}
              />
              <div className="mt-1.5 flex justify-end">
                <MicButton onTranscript={(text) => setAboutMeText(text)} size="sm" />
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAboutMeSave}
                disabled={!aboutMeText.trim()}
                className="w-full py-3.5 bg-mind-600 text-white rounded-xl text-base font-medium
                           hover:bg-mind-700 transition-colors duration-200 disabled:opacity-40"
              >
                Save
              </button>
              <button
                onClick={handleAboutMeSkip}
                className="w-full py-3 text-calm-muted text-sm hover:text-calm-text transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
