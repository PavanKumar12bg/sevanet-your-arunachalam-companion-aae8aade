import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGS } from "@/i18n";
import { useEffect, useRef, useState } from "react";

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SUPPORTED_LANGS.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGS[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:border-accent hover:bg-accent/10 transition-colors"
        aria-label="Language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{current.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl border border-border bg-popover shadow-elegant overflow-hidden z-50 animate-fade-in">
          {SUPPORTED_LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { i18n.changeLanguage(l.code); setOpen(false); }}
              lang={l.htmlLang}
              className={`block w-full text-left px-3 py-2 text-sm hover:bg-accent/10 transition-colors ${l.code === current.code ? "text-accent font-semibold" : ""}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
