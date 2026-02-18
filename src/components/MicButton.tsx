"use client";

import { useSpeech } from "@/lib/useSpeech";
import { useEffect } from "react";

interface MicButtonProps {
  onTranscript: (text: string) => void;  // Called with final text when user stops
  size?: "sm" | "md";                     // sm for inline inputs, md for chat
  className?: string;
}

export default function MicButton({ onTranscript, size = "md", className = "" }: MicButtonProps) {
  const { isSupported, isListening, transcript, toggleListening } = useSpeech(onTranscript);

  // Live preview: update parent with interim results while speaking
  useEffect(() => {
    if (isListening && transcript) {
      onTranscript(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

  if (!isSupported) return null; // Gracefully hide on unsupported browsers

  const sizeClasses = size === "sm"
    ? "p-1.5 rounded-lg"
    : "p-3 rounded-xl";

  const iconSize = size === "sm" ? 14 : 18;

  return (
    <button
      onClick={toggleListening}
      className={`transition-all duration-200 flex-shrink-0 ${sizeClasses} ${
        isListening
          ? "bg-red-500 text-white animate-pulse"
          : "bg-mind-100 text-mind-600 hover:bg-mind-200"
      } ${className}`}
      aria-label={isListening ? "Stop recording" : "Start voice input"}
      type="button"
    >
      {isListening ? (
        // Stop icon (square)
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        // Microphone icon
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}
    </button>
  );
}
