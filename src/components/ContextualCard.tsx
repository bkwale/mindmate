"use client";

import { useState, useEffect } from "react";
import { SessionMode } from "@/lib/prompts";
import { CheckIn, FollowUp, OpenLoop, PatternSignal, SessionRecord, ThemeEntry } from "@/lib/storage";
import MicButton from "./MicButton";

const CHECKIN_PLACEHOLDERS = ["calm...", "anxious...", "tired...", "hopeful...", "heavy...", "lighter..."];

function useCyclingPlaceholder(words: string[], intervalMs = 3000): string {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % words.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [words, intervalMs]);
  return words[index];
}

interface ContextualCardProps {
  unresolved: FollowUp | null;
  followUpExpanded: boolean;
  followUpResponse: string;
  setFollowUpResponse: (val: string | ((prev: string) => string)) => void;
  handleFollowUpResolution: (status: "yes" | "not-yet" | "changed-mind") => void;
  handleFollowUpSave: () => void;
  openLoop: OpenLoop | null;
  handleRevisitOpenLoop: () => void;
  todayCheckIn: CheckIn | null;
  checkInSubmitted: boolean;
  checkInPattern: { word: string; count: number; total: number } | null;
  relatedTheme: ThemeEntry | null;
  handleSelectModeWithCleanup: (mode: SessionMode) => void;
  checkInInput: string;
  setCheckInInput: (val: string) => void;
  checkInError: boolean;
  setCheckInError: (val: boolean) => void;
  handleCheckInSubmit: () => void;
  recentCheckIns: CheckIn[] | null;
  getDayLabel: (index: number) => string;
  topPattern: PatternSignal | null;
  lastTheme: ThemeEntry | null;
  lastSession: SessionRecord | null;
  getTimeAgo: (dateStr: string) => string;
}

export default function ContextualCard({
  unresolved,
  followUpExpanded,
  followUpResponse,
  setFollowUpResponse,
  handleFollowUpResolution,
  handleFollowUpSave,
  openLoop,
  handleRevisitOpenLoop,
  todayCheckIn,
  checkInSubmitted,
  checkInPattern,
  relatedTheme,
  handleSelectModeWithCleanup,
  checkInInput,
  setCheckInInput,
  checkInError,
  setCheckInError,
  handleCheckInSubmit,
  recentCheckIns,
  getDayLabel,
  topPattern,
  lastTheme,
  lastSession,
  getTimeAgo,
}: ContextualCardProps) {
  const checkInPlaceholder = useCyclingPlaceholder(CHECKIN_PLACEHOLDERS);

  // Priority: follow-up > open loop > check-in response > check-in > pattern > last reflection

  if (unresolved) return (
    <div className="mb-5 card-serene p-5 animate-fade-in">
      {!followUpExpanded ? (
        <>
          <p className="text-sm text-calm-text mb-4">
            You were preparing for a conversation with <span className="font-semibold text-mind-600">{unresolved.person}</span>. Did it happen?
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={() => handleFollowUpResolution("yes")}
              className="w-full px-3 py-2 bg-mind-100 hover:bg-mind-200 text-mind-700 rounded-lg transition-colors text-sm font-medium text-left min-h-[44px]">
              Yes, it happened
            </button>
            <button onClick={() => handleFollowUpResolution("not-yet")}
              className="w-full px-3 py-2 bg-calm-border/30 hover:bg-calm-border/50 text-calm-text rounded-lg transition-colors text-sm font-medium text-left min-h-[44px]">
              Not yet
            </button>
            <button onClick={() => handleFollowUpResolution("changed-mind")}
              className="w-full px-3 py-2 bg-calm-border/30 hover:bg-calm-border/50 text-calm-text rounded-lg transition-colors text-sm font-medium text-left min-h-[44px]">
              I changed my mind
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-calm-text mb-3 font-medium">How did it go?</p>
          <textarea value={followUpResponse} onChange={(e) => setFollowUpResponse(e.target.value)}
            placeholder="Share how the conversation went..."
            className="w-full bg-mind-50 border border-mind-200 rounded-lg px-3 py-2 text-sm text-calm-text placeholder-calm-muted focus:outline-none focus:border-mind-400 transition-colors resize-none" rows={4} />
          <div className="mt-1.5 flex justify-end">
            <MicButton onTranscript={(text) => setFollowUpResponse((prev: string) => prev ? prev + " " + text : text)} size="sm" />
          </div>
          <button onClick={handleFollowUpSave}
            className="w-full mt-3 px-3 py-2 bg-mind-500 hover:bg-mind-600 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px]">
            Save
          </button>
        </>
      )}
    </div>
  );

  if (openLoop) return (
    <div className="mb-5 card-serene p-5 animate-fade-in border border-mind-200/50">
      <p className="text-xs text-calm-muted uppercase tracking-wider mb-3 font-medium">Something from last time...</p>
      <p className="text-sm text-calm-text italic mb-4 leading-relaxed">{openLoop.text}</p>
      <button onClick={handleRevisitOpenLoop}
        className="w-full px-3 py-2 bg-mind-100 hover:bg-mind-200 text-mind-700 rounded-lg transition-colors text-sm font-medium min-h-[44px]">
        Revisit this
      </button>
    </div>
  );

  if (todayCheckIn && checkInSubmitted && (checkInPattern || relatedTheme)) return (
    <div className="mb-5 card-serene p-5 animate-fade-in border border-mind-200/50">
      <div className="space-y-3">
        {checkInPattern && (
          <p className="text-sm text-calm-text">
            <span className="text-mind-600 font-semibold">{checkInPattern.count}</span> of your last <span className="text-mind-600 font-semibold">{checkInPattern.total}</span> check-ins were <span className="text-mind-600 font-semibold">{checkInPattern.word}</span>
          </p>
        )}
        {relatedTheme && (
          <div className="pt-2 border-t border-mind-100">
            <p className="text-xs text-calm-muted mb-2">Last time, it was connected to:</p>
            <p className="text-sm text-calm-text italic">{relatedTheme.theme}</p>
          </div>
        )}
        <div className="pt-2">
          <button onClick={() => handleSelectModeWithCleanup("reflect")}
            className="w-full px-3 py-2 bg-mind-100 hover:bg-mind-200 text-mind-700 rounded-lg transition-colors text-sm font-medium min-h-[44px]">
            Sit with this?
          </button>
        </div>
      </div>
    </div>
  );

  // Check-in input (no previous submission today)
  if (!todayCheckIn) return (
    <div className="mb-5 card-serene p-5 animate-fade-in">
      <label className="text-sm text-calm-text font-medium block mb-3">How are you arriving today?</label>
      <div className="flex gap-2">
        <input type="text" value={checkInInput}
          onChange={(e) => { setCheckInInput(e.target.value); setCheckInError(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleCheckInSubmit(); }}
          placeholder={checkInPlaceholder}
          className={`flex-1 bg-mind-50 border rounded-lg px-3 py-2 text-sm text-calm-text placeholder-calm-muted focus:outline-none transition-colors min-h-[44px] ${
            checkInError ? "border-warm-300 focus:border-warm-400" : "border-mind-200 focus:border-mind-400"
          }`} />
        <MicButton onTranscript={(text) => { const firstWord = text.trim().split(/\s+/)[0] || ""; setCheckInInput(firstWord.toLowerCase()); setCheckInError(false); }} size="sm" />
        <button onClick={handleCheckInSubmit}
          className="px-3 py-2 bg-mind-100 hover:bg-mind-200 text-mind-600 rounded-lg transition-colors text-sm font-medium min-h-[44px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </button>
      </div>
      {checkInError && <p className="text-xs text-warm-600 mt-2">Please enter a single word</p>}
    </div>
  );

  // Today's check-in display (already submitted, no pattern/theme to show)
  if (todayCheckIn) return (
    <div className="mb-5 card-serene p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm text-calm-text font-medium">Today: <span className="text-mind-600 font-semibold">{todayCheckIn.word}</span></p>
        <div className="w-1.5 h-1.5 rounded-full bg-mind-300" />
      </div>
      {recentCheckIns && recentCheckIns.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {recentCheckIns.map((checkIn, idx) => (
            <div key={idx} className="text-xs bg-mind-50 text-mind-600 rounded-full px-3 py-1">
              <span className="text-calm-muted">{getDayLabel(idx)}</span>: {checkIn.word}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (topPattern) return (
    <div className="mb-5 card-serene p-4 animate-fade-in border border-mind-200/30">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${topPattern.strength > 0.6 ? "bg-warm-100" : "bg-mind-50"}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className={topPattern.strength > 0.6 ? "text-warm-600" : "text-mind-500"}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-xs text-calm-muted uppercase tracking-wider font-medium mb-1">{topPattern.label}</p>
          <p className="text-sm text-calm-text leading-relaxed">{topPattern.description}</p>
          {topPattern.suggestion && <p className="text-xs text-mind-600 mt-2 font-light italic">{topPattern.suggestion}</p>}
        </div>
      </div>
    </div>
  );

  if (lastTheme && lastSession) return (
    <div className="mb-5 card-serene p-4 animate-fade-in">
      <p className="text-[10px] text-calm-muted uppercase tracking-wider mb-2 font-medium">
        Last time you were here &middot; {getTimeAgo(lastSession.completedAt)}
      </p>
      <p className="text-sm text-calm-text leading-relaxed">{lastTheme.theme}</p>
      {lastSession.takeaway && <p className="text-xs text-calm-muted mt-2 italic leading-relaxed">&ldquo;{lastSession.takeaway}&rdquo;</p>}
    </div>
  );

  return null;
}
