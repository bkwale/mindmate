"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ============================================================
// useSpeech — browser-native voice-to-text hook
// Uses the Web Speech API (SpeechRecognition).
// Works in Chrome, Edge, Safari (mobile + desktop).
// Falls back gracefully — returns isSupported: false on Firefox etc.
// ============================================================

interface UseSpeechReturn {
  isSupported: boolean;   // Browser supports speech recognition
  isListening: boolean;   // Currently recording
  transcript: string;     // Latest transcribed text
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
}

export function useSpeech(onResult?: (text: string) => void): UseSpeechReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;         // Keep listening until stopped
    recognition.interimResults = true;     // Show partial results as they speak
    recognition.lang = navigator.language || "en-GB"; // Use browser's language, fallback to en-GB

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      const full = (finalTranscript + interim).trim();
      setTranscript(full);
    };

    recognition.onerror = (event: any) => {
      // "no-speech" and "aborted" are normal — user just stopped talking
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("Speech recognition error:", event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Deliver final result
      const trimmed = finalTranscript.trim();
      if (trimmed && onResult) {
        onResult(trimmed);
      }
    };

    recognitionRef.current = recognition;
    setTranscript("");
    setIsListening(true);

    try {
      recognition.start();
    } catch (err) {
      console.warn("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  }, [isSupported, isListening, onResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop(); // triggers onend → delivers result
      } catch { /* ignore */ }
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}
