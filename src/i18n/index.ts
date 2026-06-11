import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import te from "./locales/te.json";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import kn from "./locales/kn.json";

export const SUPPORTED_LANGS = [
  { code: "te", label: "తెలుగు", htmlLang: "te-IN" },
  { code: "hi", label: "हिन्दी", htmlLang: "hi-IN" },
  { code: "kn", label: "ಕನ್ನಡ", htmlLang: "kn-IN" },
  { code: "en", label: "English", htmlLang: "en" },
] as const;

export type LangCode = (typeof SUPPORTED_LANGS)[number]["code"];
export const LANG_STORAGE_KEY = "sevanet:lang";

function normalizeLanguage(lng: string | undefined): LangCode {
  const code = lng?.split("-")[0] as LangCode | undefined;
  return SUPPORTED_LANGS.some((l) => l.code === code) ? code! : "te";
}

// SSR/mobile-safe storage helpers. Some Android WebViews and PWAs throw
// SecurityError when accessing localStorage — never let that crash the app.
export function safeReadLang(): LangCode {
  if (typeof window === "undefined") return "te";
  try {
    const stored = window.localStorage?.getItem(LANG_STORAGE_KEY);
    if (stored) return normalizeLanguage(stored);
    const nav = window.navigator?.language;
    return normalizeLanguage(nav);
  } catch {
    return "te";
  }
}

export function safeWriteLang(lng: string) {
  if (typeof window === "undefined") return;
  try { window.localStorage?.setItem(LANG_STORAGE_KEY, lng); } catch {}
}

export function syncDocumentLanguage(lng: string | undefined = i18n.language) {
  if (typeof document === "undefined") return;
  const code = normalizeLanguage(lng);
  const meta = SUPPORTED_LANGS.find((l) => l.code === code) ?? SUPPORTED_LANGS[0];
  try { document.documentElement.setAttribute("lang", meta.htmlLang); } catch {}
}

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: { te: { translation: te }, en: { translation: en }, hi: { translation: hi }, kn: { translation: kn } },
      fallbackLng: "te",
      lng: "te", // Telugu by default — client may switch after mount
      supportedLngs: ["te", "hi", "kn", "en"],
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

export default i18n;
