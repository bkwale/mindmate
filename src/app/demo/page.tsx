"use client";

import { useState, useEffect, useRef } from "react";

// Demo scenarios tailored for Herefordshire Business Expo — wellbeing area
// Audience: business owners, employees, SAS personnel, carers, aging population
const scenarios = [
  {
    title: "Work overwhelm",
    exchanges: [
      {
        q: "What's been on your mind lately that you haven't said out loud?",
        a: "I can't switch off. Even when I'm home, my head is still at work. There's always something I haven't finished.",
      },
      {
        q: "When you say you can't switch off — what's the thing your mind keeps going back to?",
        a: "It's this feeling that I'm falling behind. Like everyone else has it figured out and I'm just firefighting every day.",
      },
      {
        q: "That sounds exhausting — the constant sense of catching up. What would 'enough' look like for you on a normal day?",
        a: "Honestly? Just finishing one thing properly without three more landing on my desk. Having a moment to think instead of just react.",
      },
      {
        q: "So what you're really after isn't less work — it's space to think clearly. What's one small thing you could protect this week to give yourself that?",
        a: "Maybe blocking out an hour in the morning before I open emails. Just to plan the day on my own terms.",
      },
      {
        q: "That's a concrete step. Before we finish — what feels clearer now than when we started?",
        a: "I think I've been treating the overwhelm like it's about volume. But it's actually about control. I just need some of it back.",
      },
    ],
  },
  {
    title: "Burnout",
    exchanges: [
      {
        q: "What's been on your mind lately that you haven't said out loud?",
        a: "I used to love what I do. Now I'm just going through the motions. I don't know when that changed.",
      },
      {
        q: "That shift — from caring to just coping — when do you first remember noticing it?",
        a: "A few months ago. I started dreading Mondays. Not because of anything specific, just... everything felt heavy.",
      },
      {
        q: "Heavy is a good word for it. What's the heaviest part right now?",
        a: "Feeling like I can't say I'm struggling. Everyone thinks I've got it together. I don't want to let people down.",
      },
      {
        q: "So you're carrying two things — the tiredness itself, and the pressure to hide it. Which one weighs more?",
        a: "The hiding. Definitely. The work I could manage if I didn't feel like I had to perform being fine all the time.",
      },
      {
        q: "What would it look like to let one person in — just enough to take the edge off the hiding?",
        a: "There's someone at work I trust. Maybe I don't need to tell them everything. Just enough so I'm not doing this alone.",
      },
    ],
  },
  {
    title: "Stress at home",
    exchanges: [
      {
        q: "What's been on your mind lately that you haven't said out loud?",
        a: "I'm looking after my mum and running the business. Some days I don't know which one needs me more.",
      },
      {
        q: "That pull in two directions — where do you feel it most?",
        a: "The guilt. When I'm with mum, I'm thinking about work. When I'm working, I feel guilty I'm not with her.",
      },
      {
        q: "It sounds like wherever you are, part of you is somewhere else. When was the last time you were fully present in one place?",
        a: "I can't remember. That's the honest answer. Maybe months.",
      },
      {
        q: "That's a hard thing to notice. What would it take — not to fix everything — but to have one hour this week where you're just in one place?",
        a: "I think I need to accept that good enough is actually good enough. I keep trying to be perfect at both and I'm burning out.",
      },
      {
        q: "Good enough is good enough. That's worth holding onto. What's one thing you can let be 'good enough' this week without guilt?",
        a: "The house. It doesn't need to be spotless for mum's carer. I can let that go.",
      },
    ],
  },
];

// Typing speed
const CHAR_DELAY = 35; // ms per character for typing effect
const PAUSE_AFTER_Q = 1500; // pause after question appears before typing answer
const PAUSE_AFTER_A = 2500; // pause after answer before next question
const PAUSE_BETWEEN_SCENARIOS = 5000; // pause between scenarios
const PAUSE_BEFORE_START = 2000; // initial pause

export default function DemoPage() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [exchangeIndex, setExchangeIndex] = useState(-1); // -1 = showing title
  const [displayedMessages, setDisplayedMessages] = useState<
    { role: "assistant" | "user"; content: string; typing?: boolean }[]
  >([]);
  const [typingText, setTypingText] = useState("");
  const [phase, setPhase] = useState<"title" | "question" | "typing-answer" | "pause" | "ending">("title");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = scenarios[scenarioIndex];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages, typingText]);

  // Main animation loop
  useEffect(() => {
    const clear = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    if (phase === "title") {
      clear();
      setDisplayedMessages([]);
      setTypingText("");
      setExchangeIndex(-1);
      timeoutRef.current = setTimeout(() => {
        setExchangeIndex(0);
        setPhase("question");
      }, PAUSE_BEFORE_START);
    }

    if (phase === "question") {
      clear();
      const exchange = scenario.exchanges[exchangeIndex];
      if (!exchange) {
        setPhase("ending");
        return;
      }
      // Show question immediately
      setDisplayedMessages((prev) => [
        ...prev,
        { role: "assistant", content: exchange.q },
      ]);
      timeoutRef.current = setTimeout(() => {
        setPhase("typing-answer");
      }, PAUSE_AFTER_Q);
    }

    if (phase === "typing-answer") {
      clear();
      const exchange = scenario.exchanges[exchangeIndex];
      if (!exchange) return;
      const answer = exchange.a;
      let charIndex = 0;
      setTypingText("");

      const typeNext = () => {
        if (charIndex < answer.length) {
          charIndex++;
          setTypingText(answer.slice(0, charIndex));
          timeoutRef.current = setTimeout(typeNext, CHAR_DELAY);
        } else {
          // Typing done — commit message
          setDisplayedMessages((prev) => [
            ...prev,
            { role: "user", content: answer },
          ]);
          setTypingText("");
          timeoutRef.current = setTimeout(() => {
            const nextIdx = exchangeIndex + 1;
            if (nextIdx < scenario.exchanges.length) {
              setExchangeIndex(nextIdx);
              setPhase("question");
            } else {
              setPhase("ending");
            }
          }, PAUSE_AFTER_A);
        }
      };
      timeoutRef.current = setTimeout(typeNext, 300);
    }

    if (phase === "ending") {
      clear();
      timeoutRef.current = setTimeout(() => {
        const nextScenario = (scenarioIndex + 1) % scenarios.length;
        setScenarioIndex(nextScenario);
        setPhase("title");
      }, PAUSE_BETWEEN_SCENARIOS);
    }

    return () => clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, exchangeIndex, scenarioIndex]);

  return (
    <div className="min-h-screen bg-thermal flex flex-col">
      {/* Header */}
      <div className="text-center pt-8 pb-4 px-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="meditation-circle-sm" />
          <h1 className="text-xl font-light text-calm-text tracking-wide">
            MindM8
          </h1>
          <div className="meditation-circle-sm" />
        </div>
        <p className="text-sm text-calm-muted font-light">
          Your pocket companion for emotional clarity
        </p>
      </div>

      {/* Scenario label */}
      <div className="text-center pb-3">
        <span className="inline-block px-4 py-1.5 rounded-full bg-mind-100 text-mind-700 text-xs font-medium tracking-wide">
          {scenario.title}
        </span>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {displayedMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-white text-calm-text shadow-sm border border-calm-border/50"
                    : "bg-mind-600 text-white"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typingText && (
            <div className="flex justify-end animate-fade-in">
              <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed bg-mind-600 text-white">
                {typingText}
                <span className="inline-block w-0.5 h-4 bg-white/70 ml-0.5 animate-pulse align-middle" />
              </div>
            </div>
          )}

          {/* End of scenario message */}
          {phase === "ending" && (
            <div className="text-center py-6 animate-fade-in">
              <div className="meditation-circle mx-auto mb-4" />
              <p className="text-sm text-calm-text font-light italic">
                That&apos;s a good place to land.
              </p>
              <p className="text-xs text-calm-muted mt-2">
                Next scenario starting shortly...
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer — scan prompt */}
      <div className="text-center py-4 border-t border-calm-border/30 bg-calm-bg/80 backdrop-blur-sm">
        <p className="text-sm text-mind-600 font-medium">
          Try it yourself — scan the QR code or visit mindm8.app
        </p>
        <p className="text-xs text-calm-muted mt-1">
          Free. No sign-up. Completely private.
        </p>
      </div>
    </div>
  );
}
