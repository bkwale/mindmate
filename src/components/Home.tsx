"use client";

import { SessionMode } from "@/lib/prompts";
import { recentSessionCount } from "@/lib/storage";

interface HomeProps {
  onSelectMode: (mode: SessionMode) => void;
  onOpenInsights: () => void;
}

const doors = [
  {
    mode: "reflect" as SessionMode,
    title: "I need to think",
    description: "Process an emotion, an event, or something you can't name yet.",
    exchanges: "5 reflections",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    mode: "prepare" as SessionMode,
    title: "I need to prepare",
    description: "Clarify what you want to say before a difficult conversation.",
    exchanges: "7 reflections",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    mode: "ground" as SessionMode,
    title: "I just need a moment",
    description: "Slow down. Breathe. Name one feeling.",
    exchanges: "3 reflections",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 6v6" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
];

export default function Home({ onSelectMode, onOpenInsights }: HomeProps) {
  const recentCount = recentSessionCount();
  const showPauseMessage = recentCount >= 3;

  return (
    <div className="min-h-screen bg-calm-bg flex flex-col">
      {/* Header */}
      <header className="pt-12 pb-6 px-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="w-8" />
          <div className="text-center">
            <h1 className="text-2xl font-serif text-calm-text tracking-tight">
              MindMate
            </h1>
            <p className="text-calm-muted text-sm mt-2">
              What brings you here?
            </p>
          </div>
          <button
            onClick={onOpenInsights}
            className="text-calm-muted hover:text-mind-600 transition-colors p-1"
            aria-label="Your reflections"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Three Doors */}
      <main className="flex-1 px-6 pb-8 max-w-md mx-auto w-full">
        {showPauseMessage && (
          <div className="mb-6 bg-warm-50 border border-warm-200 rounded-xl p-4 animate-fade-in">
            <p className="text-sm text-warm-700 leading-relaxed">
              You&apos;ve reflected a lot today. It might help to step away and come
              back to this later.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {doors.map((door) => (
            <button
              key={door.mode}
              onClick={() => onSelectMode(door.mode)}
              className="w-full text-left bg-white rounded-2xl p-5 border border-calm-border
                         hover:border-mind-300 hover:shadow-sm transition-all duration-200
                         group"
            >
              <div className="flex items-start gap-4">
                <div className="text-mind-500 group-hover:text-mind-600 transition-colors mt-0.5">
                  {door.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-calm-text group-hover:text-mind-700 transition-colors">
                    {door.title}
                  </h3>
                  <p className="text-sm text-calm-muted mt-1 leading-relaxed">
                    {door.description}
                  </p>
                  <p className="text-xs text-mind-500 mt-2">
                    {door.exchanges}
                  </p>
                </div>
                <div className="text-calm-border group-hover:text-mind-400 transition-colors mt-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Subtle footer */}
        <p className="text-center text-xs text-calm-muted/60 mt-8">
          Not therapy. Not a chatbot. A space to reflect.
        </p>
      </main>
    </div>
  );
}
