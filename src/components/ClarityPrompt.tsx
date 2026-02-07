"use client";

interface ClarityPromptProps {
  onRespond: (response: "yes" | "no" | "skip") => void;
}

export default function ClarityPrompt({ onRespond }: ClarityPromptProps) {
  return (
    <div className="min-h-screen bg-calm-bg flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-full bg-mind-100 flex items-center justify-center mx-auto">
            <div className="w-3 h-3 rounded-full bg-mind-500" />
          </div>
          <h2 className="text-lg font-serif text-calm-text">
            One last thing
          </h2>
        </div>

        <p className="text-calm-muted leading-relaxed">
          Did this help you think more clearly?
        </p>

        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => onRespond("yes")}
              className="flex-1 py-3.5 bg-mind-600 text-white rounded-xl text-sm font-medium
                         hover:bg-mind-700 transition-colors duration-200"
            >
              Yes
            </button>
            <button
              onClick={() => onRespond("no")}
              className="flex-1 py-3.5 border border-calm-border text-calm-text rounded-xl text-sm
                         hover:bg-warm-50 transition-colors duration-200"
            >
              Not really
            </button>
          </div>
          <button
            onClick={() => onRespond("skip")}
            className="w-full py-2 text-calm-muted text-xs hover:text-calm-text transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
