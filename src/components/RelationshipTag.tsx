"use client";

interface RelationshipTagProps {
  selected: string | null;
  onSelect: (tag: string | null) => void;
}

const tags = [
  { id: "partner", label: "Partner", icon: "♡" },
  { id: "family", label: "Family", icon: "⌂" },
  { id: "work", label: "Work", icon: "◆" },
  { id: "friend", label: "Friend", icon: "○" },
  { id: "self", label: "Self", icon: "◎" },
  { id: "ex-partner", label: "Ex", icon: "×" },
  { id: "child", label: "Child", icon: "☆" },
];

export default function RelationshipTag({ selected, onSelect }: RelationshipTagProps) {
  return (
    <div className="animate-fade-in">
      <p className="text-xs text-calm-muted mb-2.5">
        Who is this about? <span className="text-calm-muted/50">(optional)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <button
            key={tag.id}
            onClick={() => onSelect(selected === tag.id ? null : tag.id)}
            className={`px-3 py-1.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5
              ${
                selected === tag.id
                  ? "bg-mind-600 text-white"
                  : "bg-white border border-calm-border text-calm-muted hover:border-mind-300 hover:text-calm-text"
              }`}
          >
            <span className="text-[10px]">{tag.icon}</span>
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}
