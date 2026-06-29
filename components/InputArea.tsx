"use client";

import { useState, useRef, KeyboardEvent, ChangeEvent } from "react";

interface InputAreaProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

const VSO_HINT = "Tip: plak hier de tekst van je VSO of ander document — Lisa leest het direct mee.";

export default function InputArea({ onSend, isLoading }: InputAreaProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    // Reset hoogte
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
    }
  };

  const isLongText = value.length > 300;

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      {isLongText && (
        <p className="text-xs text-gray-400 mb-2">{VSO_HINT}</p>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Typ je bericht…"
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:border-transparent transition
            disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ maxHeight: "200px", minHeight: "42px",
            // @ts-expect-error — CSS custom property
            "--tw-ring-color": "var(--brand)" }}
        />

        <button
          onClick={handleSend}
          disabled={isLoading || !value.trim()}
          aria-label="Verstuur"
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition
            disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--brand)" }}
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-[11px] text-gray-400 mt-1.5 text-center">
        Enter = versturen · Shift+Enter = nieuwe regel
      </p>
    </div>
  );
}
