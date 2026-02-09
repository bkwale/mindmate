"use client";

import { useState, useRef, useEffect } from "react";
import { SessionMode, SESSION_LIMITS } from "@/lib/prompts";
import { getThemeSummaries, getAboutMe, addSession, addTheme, addLetter, addFollowUp, saveOpenLoop } from "@/lib/storage";
import { trackEvent } from "@/lib/cohort";
import RelationshipTag from "./RelationshipTag";

interface SessionProps {
  mode: SessionMode;
  onEnd: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const modeLabels: Record<SessionMode, string> = {
  reflect: "Reflecting",
  prepare: "Preparing",
  ground: "Grounding",
};

const modeIntros: Record<SessionMode, { heading: string; description: string; tip: string }> = {
  reflect: {
    heading: "Guided Reflection",
    description: "You\u2019ll explore an emotion, an event, or something you can\u2019t quite name yet. MindM8 will ask questions to help you see it more clearly.",
    tip: "There are no right answers. Say what\u2019s true, not what sounds good.",
  },
  prepare: {
    heading: "Conversation Prep",
    description: "You\u2019ll work through a difficult conversation before it happens. MindM8 will help you clarify what you need to say and how you want to feel after.",
    tip: "Think about one specific person and one specific conversation.",
  },
  ground: {
    heading: "Grounding",
    description: "This is a short, quiet check-in. You\u2019ll slow down, name how you feel, and sit with it for a moment.",
    tip: "Keep it simple. One word is enough.",
  },
};

const firstPrompts: Record<SessionMode, string> = {
  reflect: "What's been on your mind lately that you haven't said out loud?",
  prepare: "What conversation have you been thinking about? Who is it with, and what do you need them to hear?",
  ground: "Take a breath. What's one word for how you feel right now?",
};

export default function Session({ mode, onEnd }: SessionProps) {
  const maxExchanges = SESSION_LIMITS[mode];
  const [showIntro, setShowIntro] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: firstPrompts[mode] },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relationshipTag, setRelationshipTag] = useState<string | null>(null);
  const [takeaway, setTakeaway] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [shared, setShared] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [letterContent, setLetterContent] = useState("");
  const [letterSaved, setLetterSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isComplete]);

  useEffect(() => {
    if (!isLoading && !isComplete) {
      inputRef.current?.focus();
    }
  }, [isLoading, isComplete]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || isComplete) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    // Track session start on first message
    if (exchangeCount === 0) {
      trackEvent("session_start", { mode });
    }

    try {
      const themes = getThemeSummaries();
      const aboutMe = getAboutMe();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          mode,
          exchangeCount,
          themes: themes.length > 0 ? themes : null,
          aboutMe,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Something went wrong");
      }

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);

      const newCount = exchangeCount + 1;
      setExchangeCount(newCount);

      if (data.isComplete || newCount >= maxExchanges) {
        setIsComplete(true);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const extractThemes = async () => {
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          mode,
          relationshipContext: relationshipTag,
        }),
      });

      if (response.ok) {
        const extracted = await response.json();
        if (!extracted.crisis_adjacent && !extracted.error) {
          addTheme({
            emotion: extracted.emotion || "unspecified",
            context: extracted.context || relationshipTag || "general",
            theme: extracted.theme || "Reflection completed",
            mode,
          });
        }
      }
    } catch (err) {
      console.error("Theme extraction failed:", err);
    }
  };

  const handleSoftEnd = async (clarity: "yes" | "no" | "skip") => {
    // For prepare mode, show letter writing instead of immediately ending
    if (mode === "prepare") {
      setShowLetter(true);
      return;
    }

    setIsSaving(true);

    // Save session with all data at once
    addSession({
      mode,
      exchanges: exchangeCount,
      clarityResponse: clarity,
      takeaway: takeaway.trim() || undefined,
      summary: messages[messages.length - 1]?.content || "",
    });

    // Extract themes (skip for grounding — minimal data)
    if (mode !== "ground") {
      await extractThemes();
    }

    // Save open loop from user's most substantive message
    const seed = extractSeed();
    if (seed) {
      saveOpenLoop({ text: seed, date: new Date().toISOString(), mode, context: relationshipTag || undefined });
    }

    // Track session completion
    trackEvent("session_complete", { mode });

    setIsSaving(false);
    onEnd();
  };

  const handleLetterSave = async () => {
    setLetterSaved(true);
    setIsSaving(true);

    // Save the letter
    if (letterContent.trim()) {
      addLetter(relationshipTag || "someone", letterContent);
    }

    // Save session
    addSession({
      mode,
      exchanges: exchangeCount,
      clarityResponse: "yes",
      takeaway: takeaway.trim() || undefined,
      summary: messages[messages.length - 1]?.content || "",
    });

    // Extract themes
    if (mode !== "ground") {
      await extractThemes();
    }

    // Add follow-up if there's a relationship tag
    if (relationshipTag) {
      addFollowUp(relationshipTag);
    }

    // Save open loop from user's most substantive message
    const seed = extractSeed();
    if (seed) {
      saveOpenLoop({ text: seed, date: new Date().toISOString(), mode, context: relationshipTag || undefined });
    }

    // Track session completion
    trackEvent("session_complete", { mode });

    setIsSaving(false);
    onEnd();
  };

  const handleLetterSkip = async () => {
    setIsSaving(true);

    // Save session without letter
    addSession({
      mode,
      exchanges: exchangeCount,
      clarityResponse: "yes",
      takeaway: takeaway.trim() || undefined,
      summary: messages[messages.length - 1]?.content || "",
    });

    // Extract themes
    if (mode !== "ground") {
      await extractThemes();
    }

    // Add follow-up if there's a relationship tag
    if (relationshipTag) {
      addFollowUp(relationshipTag);
    }

    // Save open loop from user's most substantive message
    const seed = extractSeed();
    if (seed) {
      saveOpenLoop({ text: seed, date: new Date().toISOString(), mode, context: relationshipTag || undefined });
    }

    // Track session completion
    trackEvent("session_complete", { mode });

    setIsSaving(false);
    onEnd();
  };

  const handleShare = async () => {
    if (!takeaway.trim()) return;

    const shareText = `Something I sat with today: ${takeaway.trim()}`;

    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
        setShared(true);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        setShared(true);
        // Reset after 2 seconds
        setTimeout(() => setShared(false), 2000);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const extractSeed = (): string | null => {
    const userMessages = messages.filter(m => m.role === "user");
    if (userMessages.length === 0) return null;
    // Pick the longest substantive message
    const sorted = [...userMessages].sort((a, b) => b.content.length - a.content.length);
    const best = sorted[0];
    if (best.content.split(/\s+/).length < 5) return null;
    // Truncate if too long
    const words = best.content.split(/\s+/);
    if (words.length > 25) return words.slice(0, 25).join(" ") + "...";
    return best.content;
  };

  // Mode intro screen
  if (showIntro) {
    const intro = modeIntros[mode];
    return (
      <div className="min-h-screen bg-thermal flex items-center justify-center p-6 relative overflow-hidden">
        <div className="mist-layer" style={{ top: "10%", right: "-60px" }} />
        <div className="warm-glow" style={{ bottom: "5%", left: "-80px" }} />
        <div className="max-w-md w-full animate-fade-in relative z-10">
          <div className="text-center space-y-6">
            {/* Breathing meditation circle */}
            <div className="flex justify-center mb-2">
              <div className="meditation-circle" />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-mind-400 uppercase tracking-widest font-medium">
                {modeLabels[mode]}
              </p>
              <h2 className="text-xl font-serif text-calm-text">
                {intro.heading}
              </h2>
            </div>
            <p className="text-calm-muted text-sm leading-relaxed font-light">
              {intro.description}
            </p>
            <div className="bg-mind-50/60 border border-mind-100/50 rounded-2xl px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-mind-700 leading-relaxed">
                {intro.tip}
              </p>
            </div>
            <p className="text-xs text-calm-muted font-light">
              {maxExchanges} exchanges &middot; be honest to get the most from this
            </p>
            <button
              onClick={() => setShowIntro(false)}
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

  return (
    <div className="min-h-screen bg-stillwater flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-calm-bg/80 backdrop-blur-md border-b border-calm-border/50 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onEnd}
            className="text-calm-muted hover:text-calm-text transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-calm-text">
              {modeLabels[mode]}
            </p>
            <p className="text-xs text-calm-muted">
              {exchangeCount} of {maxExchanges}
            </p>
          </div>
          <div className="w-7 flex justify-end">
            {relationshipTag && (
              <span className="w-5 h-5 rounded-full bg-mind-100 flex items-center justify-center text-[9px] text-mind-600">
                {relationshipTag.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div className="h-0.5 bg-calm-border">
          <div
            className="h-full bg-mind-500 transition-all duration-500 ease-out"
            style={{ width: `${(exchangeCount / maxExchanges) * 100}%` }}
          />
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
          {/* Relationship tagging — shown before first user message */}
          {exchangeCount === 0 && mode !== "ground" && (
            <div className="px-1 mb-2">
              <RelationshipTag
                selected={relationshipTag}
                onSelect={setRelationshipTag}
              />
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`animate-slide-up ${
                msg.role === "assistant" ? "pr-8" : "pl-8"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-mind-100/70 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="meditation-circle-sm" />
                  </div>
                  <div className="bg-calm-card rounded-2xl rounded-tl-md px-4 py-3 border border-calm-border/50 shadow-sm">
                    <p className="text-sm text-calm-text leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="bg-mind-600 rounded-2xl rounded-tr-md px-4 py-3">
                    <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 animate-fade-in pr-8">
              <div className="w-7 h-7 rounded-full bg-mind-100 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-mind-500 animate-breathe" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 border border-calm-border">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-calm-muted/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-calm-muted/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-calm-muted/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-warm-50 border border-warm-200 rounded-xl p-4 animate-fade-in">
              <p className="text-sm text-warm-700">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Footer — input, soft landing, or letter writing */}
      <footer className="sticky bottom-0 bg-calm-bg/80 backdrop-blur-md border-t border-calm-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          {/* Letter writing phase (prepare mode only) */}
          {showLetter && !isSaving ? (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-thermal rounded-2xl p-6 card-serene">
                <h3 className="font-serif text-lg text-calm-text mb-1">
                  Write them a letter
                </h3>
                <p className="text-xs text-calm-muted font-light mb-4">
                  Get the words out. This is just for you — it will never be sent.
                </p>
                <textarea
                  value={letterContent}
                  onChange={e => setLetterContent(e.target.value)}
                  placeholder="Write freely..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-calm-border bg-white
                             text-sm text-calm-text placeholder:text-calm-muted/40
                             focus:outline-none focus:border-mind-400 transition-colors resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleLetterSave}
                  className="flex-1 py-3 bg-mind-600 text-white rounded-xl text-sm font-medium
                             hover:bg-mind-700 transition-colors duration-200"
                >
                  Save letter
                </button>
                <button
                  onClick={handleLetterSkip}
                  className="flex-1 py-2 text-calm-muted text-xs hover:text-calm-text transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          ) : showLetter && isSaving ? (
            <div className="text-center py-4 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-mind-100 flex items-center justify-center mx-auto mb-2">
                <div className="w-2 h-2 rounded-full bg-mind-500 animate-breathe" />
              </div>
              <p className="text-sm text-calm-muted">Saving your reflection...</p>
            </div>
          ) : (
            <>
              {/* Sticky last question — so user never loses what was asked */}
              {!isComplete && !isLoading && messages.length > 0 && messages[messages.length - 1].role === "assistant" && exchangeCount > 0 && (
                <div className="mb-2 px-1">
                  <p className="text-xs text-calm-muted leading-relaxed line-clamp-2">
                    <span className="text-mind-500 font-medium">Q: </span>
                    {messages[messages.length - 1].content}
                  </p>
                </div>
              )}
              {isComplete ? (
                isSaving ? (
                  <div className="text-center py-4 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-mind-100 flex items-center justify-center mx-auto mb-2">
                      <div className="w-2 h-2 rounded-full bg-mind-500 animate-breathe" />
                    </div>
                    <p className="text-sm text-calm-muted">Saving your reflection...</p>
                  </div>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    {/* Takeaway — the user gets the last word */}
                    <div>
                      <label className="text-xs text-calm-muted block mb-1.5">
                        Anything you want to hold onto from this?
                      </label>
                      <textarea
                        value={takeaway}
                        onChange={e => setTakeaway(e.target.value)}
                        placeholder="Optional — just for you"
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-xl border border-calm-border bg-white
                                   text-sm text-calm-text placeholder:text-calm-muted/40
                                   focus:outline-none focus:border-mind-400 transition-colors resize-none"
                      />
                    </div>

                    {/* Share button — only show if takeaway exists */}
                    {takeaway.trim() && (
                      <button
                        onClick={handleShare}
                        disabled={shared}
                        className="w-full py-2 text-xs text-mind-500 hover:text-mind-600 transition-colors
                                   disabled:text-mind-400"
                      >
                        {shared ? "Shared ✓" : "Share this"}
                      </button>
                    )}

                    {/* Clarity + close */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSoftEnd("yes")}
                        className="flex-1 py-3 bg-mind-600 text-white rounded-xl text-sm font-medium
                                   hover:bg-mind-700 transition-colors duration-200"
                      >
                        That helped
                      </button>
                      <button
                        onClick={() => handleSoftEnd("no")}
                        className="flex-1 py-3 border border-calm-border text-calm-text rounded-xl text-sm
                                   hover:bg-warm-50 transition-colors duration-200"
                      >
                        Not really
                      </button>
                    </div>
                    <button
                      onClick={() => handleSoftEnd("skip")}
                      className="w-full py-1.5 text-calm-muted text-xs hover:text-calm-text transition-colors"
                    >
                      Just close
                    </button>
                  </div>
                )
              ) : (
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your thoughts..."
                    rows={1}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 rounded-xl border border-calm-border bg-white
                               text-sm text-calm-text placeholder:text-calm-muted/50
                               focus:outline-none focus:border-mind-400 transition-colors
                               resize-none disabled:opacity-50"
                    style={{ maxHeight: "120px" }}
                    onInput={e => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = Math.min(target.scrollHeight, 120) + "px";
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className="p-3 bg-mind-600 text-white rounded-xl
                               hover:bg-mind-700 transition-colors duration-200
                               disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
