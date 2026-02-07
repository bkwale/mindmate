"use client";

import { useState, useRef, useEffect } from "react";
import { SessionMode, SESSION_LIMITS } from "@/lib/prompts";
import { getThemeSummaries, addSession, addTheme } from "@/lib/storage";
import ClarityPrompt from "./ClarityPrompt";
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

const firstPrompts: Record<SessionMode, string> = {
  reflect: "What's been on your mind lately that you haven't said out loud?",
  prepare: "What conversation have you been thinking about? Who is it with, and what do you need them to hear?",
  ground: "Take a breath. What's one word for how you feel right now?",
};

export default function Session({ mode, onEnd }: SessionProps) {
  const maxExchanges = SESSION_LIMITS[mode];
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: firstPrompts[mode] },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showClarity, setShowClarity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relationshipTag, setRelationshipTag] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    try {
      const themes = getThemeSummaries();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          mode,
          exchangeCount,
          themes: themes.length > 0 ? themes : null,
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
    setIsExtracting(true);
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
    } finally {
      setIsExtracting(false);
    }
  };

  const handleEndSession = async () => {
    addSession({
      mode,
      exchanges: exchangeCount,
      summary: messages[messages.length - 1]?.content || "",
    });

    if (mode !== "ground") {
      await extractThemes();
    }

    setShowClarity(true);
  };

  const handleClarityResponse = (response: "yes" | "no" | "skip") => {
    onEnd();
  };

  if (showClarity) {
    return <ClarityPrompt onRespond={handleClarityResponse} />;
  }

  return (
    <div className="min-h-screen bg-calm-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-calm-bg/95 backdrop-blur-sm border-b border-calm-border z-10">
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
                  <div className="w-7 h-7 rounded-full bg-mind-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-mind-500" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 border border-calm-border">
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

      {/* Input */}
      <footer className="sticky bottom-0 bg-calm-bg/95 backdrop-blur-sm border-t border-calm-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          {isComplete ? (
            <button
              onClick={handleEndSession}
              disabled={isExtracting}
              className="w-full py-3.5 bg-mind-600 text-white rounded-xl text-sm font-medium
                         hover:bg-mind-700 transition-colors duration-200
                         disabled:opacity-70"
            >
              {isExtracting ? "Saving reflection..." : "End session"}
            </button>
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
        </div>
      </footer>
    </div>
  );
}
