import { SessionMode } from "@/lib/prompts";

export interface Door {
  mode: SessionMode;
  title: string;
  description: string;
  exchanges: string;
  icon: React.ReactElement;
}

export const doors: Door[] = [
  {
    mode: "reflect",
    title: "Arrive clearer",
    description: "Process an emotion, an event, or something you can’t name yet.",
    exchanges: "5 reflections",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    mode: "prepare",
    title: "Arrive ready",
    description: "Clarify what you want to say before a difficult conversation.",
    exchanges: "7 reflections",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    mode: "ground",
    title: "Arrive present",
    description: "Slow down. Breathe. Name one feeling.",
    exchanges: "3 reflections",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 6v6" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    mode: "breathe",
    title: "Just be here",
    description: "No words. No AI. Just guided breathing.",
    exchanges: "2 minutes",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
];
