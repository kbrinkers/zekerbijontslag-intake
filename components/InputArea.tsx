"use client";

import { useState, useRef, KeyboardEvent, ChangeEvent } from "react";

interface InputAreaProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export default function InputArea({ onSend, isLoading }: InputAreaProps) {
  const [value, setValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || uploading) return;
    onSend(trimmed);
    setValue("");
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
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/extract-document", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Fout bij uploaden.");
        return;
      }

      // Stuur de geÃ«xtraheerde tekst automatisch als bericht
      const prefix = `[Document: ${file.name}]\n\n`;
      onSend(prefix + data.text);
    } catch {
      setUploadError("Kan het bestand niet verwerken. Probeer het opnieuw.");
    } finally {
      setUploading(false);
      // Reset file input zodat hetzelfde bestand opnieuw gekozen kan worden
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const busy = isLoading || uploading;

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      {uploadError && (
        <p className="text-xs text-red-500 mb-2">{uploadError}</p>
      )}

      <div className="flex items-end gap-2">
        {/* Upload knop */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          aria-label="Document uploaden"
          title="PDF, Word of .txt uploaden"
          className="flex-shrink-0 w-10 h-10 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          )}
        </button>

        {/* Verborgen file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Tekst input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={uploading ? "Document wordt verwerktâ¦" : "Typ je bericht of upload een documentâ¦"}
          rows={1}
          disabled={busy}
          className="flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:border-transparent transition
            disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ maxHeight: "200px", minHeight: "42px",
            // @ts-expect-error â CSS custom property
            "--tw-ring-color": "var(--brand)" }}
        />

        {/* Verstuur knop */}
        <button
          onClick={handleSend}
          disabled={busy || !value.trim()}
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
        Enter = versturen Â· Shift+Enter = nieuwe regel Â· paperclip = PDF/Word uploaden
      </p>
    </div>
  );
}
