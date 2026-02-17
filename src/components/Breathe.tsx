"use client";

import { useState, useEffect, useRef } from "react";
import { addSession } from "@/lib/storage";
import { trackEvent } from "@/lib/cohort";

interface BreatheProps {
  onEnd: () => void;
}

const BREATH_PHASES = [
  { label: "Breathe in", duration: 4000, scale: 1.3 },
  { label: "Hold", duration: 4000, scale: 1.3 },
  { label: "Breathe out", duration: 6000, scale: 1.0 },
  { label: "Rest", duration: 2000, scale: 1.0 },
] as const;

const TOTAL_CYCLE = BREATH_PHASES.reduce((sum, p) => sum + p.duration, 0); // 16s per cycle

export default function Breathe({ onEnd }: BreatheProps) {
  const [phase, setPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const DURATION = 2 * 60 * 1000; // 2 minutes
  const cycles = Math.floor(DURATION / TOTAL_CYCLE);

  useEffect(() => {
    if (!started || finished) return;

    startTimeRef.current = Date.now();
    trackEvent("session_start", { mode: "breathe" });

    // Cycle through breath phases
    let currentPhase = 0;
    const advancePhase = () => {
      currentPhase = (currentPhase + 1) % BREATH_PHASES.length;
      setPhase(currentPhase);
    };

    const scheduleNext = () => {
      timerRef.current = setTimeout(() => {
        advancePhase();
        scheduleNext();
      }, BREATH_PHASES[currentPhase].duration);
    };
    scheduleNext();

    // Track elapsed time
    const elapsed_interval = setInterval(() => {
      const now = Date.now();
      const e = now - startTimeRef.current;
      setElapsed(e);
      if (e >= DURATION) {
        setFinished(true);
        clearInterval(elapsed_interval);
      }
    }, 200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(elapsed_interval);
    };
  }, [started, finished]);

  const handleFinish = () => {
    // Save as a session (0 exchanges — just presence)
    addSession({
      mode: "breathe",
      exchanges: 0,
      timeOfDay: (() => {
        const h = new Date().getHours();
        if (h < 6) return "night" as const;
        if (h < 12) return "morning" as const;
        if (h < 18) return "afternoon" as const;
        if (h < 22) return "evening" as const;
        return "night" as const;
      })(),
      dayOfWeek: new Date().getDay(),
    });
    trackEvent("session_complete", { mode: "breathe" });
    onEnd();
  };

  const currentPhase = BREATH_PHASES[phase];
  const progress = Math.min(elapsed / DURATION, 1);

  // Intro screen
  if (!started) {
    return (
      <div className="min-h-screen bg-thermal flex items-center justify-center p-6 relative overflow-hidden">
        <div className="mist-layer" style={{ top: "10%", right: "-60px" }} />
        <div className="warm-glow" style={{ bottom: "5%", left: "-80px" }} />
        <div className="max-w-md w-full animate-fade-in relative z-10">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-2">
              <div className="meditation-circle" />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-mind-400 uppercase tracking-widest font-medium">
                Just be here
              </p>
              <h2 className="text-xl font-serif text-calm-text">
                No words needed
              </h2>
            </div>
            <p className="text-calm-muted text-sm leading-relaxed font-light">
              Two minutes of guided breathing. No questions, no AI, no pressure to say anything. Just you and your breath.
            </p>
            <div className="bg-mind-50/60 border border-mind-100/50 rounded-2xl px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-mind-700 leading-relaxed">
                Follow the circle. Breathe in as it grows, out as it shrinks.
              </p>
            </div>
            <p className="text-xs text-calm-muted font-light">
              2 minutes &middot; {cycles} breath cycles
            </p>
            <button
              onClick={() => setStarted(true)}
              className="w-full py-3.5 bg-mind-600 text-white rounded-2xl text-base font-medium
                         hover:bg-mind-700 transition-all duration-300"
            >
              Begin
            </button>
            <button
              onClick={onEnd}
              className="w-full py-2 text-calm-muted text-xs hover:text-calm-text transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Finished screen
  if (finished) {
    return (
      <div className="min-h-screen bg-thermal flex items-center justify-center p-6 relative overflow-hidden">
        <div className="mist-layer" style={{ top: "10%", right: "-60px" }} />
        <div className="warm-glow" style={{ bottom: "5%", left: "-80px" }} />
        <div className="max-w-md w-full animate-fade-in relative z-10">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full bg-mind-100/70 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-mind-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-serif text-calm-text">
                You stayed.
              </h2>
              <p className="text-calm-muted text-sm leading-relaxed font-light">
                That&apos;s enough. You don&apos;t need to do anything else right now.
              </p>
            </div>
            <button
              onClick={handleFinish}
              className="w-full py-3.5 bg-mind-600 text-white rounded-2xl text-base font-medium
                         hover:bg-mind-700 transition-all duration-300"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active breathing screen
  return (
    <div className="min-h-screen bg-stillwater flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-calm-border">
        <div
          className="h-full bg-mind-500 transition-all duration-500 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex flex-col items-center gap-12 animate-fade-in">
        {/* Breathing circle */}
        <div className="relative flex items-center justify-center">
          <div
            className="w-40 h-40 rounded-full border-2 border-mind-300/50 flex items-center justify-center"
            style={{
              transform: `scale(${currentPhase.scale})`,
              transition: `transform ${currentPhase.duration}ms ease-in-out`,
            }}
          >
            <div
              className="w-28 h-28 rounded-full bg-mind-100/60 border border-mind-200/50 flex items-center justify-center"
              style={{
                transform: `scale(${currentPhase.scale})`,
                transition: `transform ${currentPhase.duration}ms ease-in-out`,
              }}
            >
              <div className="w-3 h-3 rounded-full bg-mind-500" />
            </div>
          </div>
        </div>

        {/* Phase label */}
        <p className="text-lg text-calm-text font-light tracking-wide animate-fade-in" key={phase}>
          {currentPhase.label}
        </p>

        {/* Timer */}
        <p className="text-xs text-calm-muted">
          {Math.max(0, Math.ceil((DURATION - elapsed) / 1000))}s remaining
        </p>
      </div>

      {/* Early exit */}
      <button
        onClick={() => {
          setFinished(true);
        }}
        className="absolute bottom-8 text-calm-muted text-xs hover:text-calm-text transition-colors"
      >
        End early
      </button>
    </div>
  );
}
