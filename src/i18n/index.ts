import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
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

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: { te: { translation: te }, en: { translation: en }, hi: { translation: hi }, kn: { translation: kn } },
      fallbackLng: "te",
      supportedLngs: ["te", "hi", "kn", "en"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "sevanet:lang",
        caches: ["localStorage"],
      },
      react: { useSuspense: false },
    });
}

// Keep <html lang> in sync for fonts + a11y + SEO
if (typeof document !== "undefined") {
  const apply = (lng: string) => {
    const meta = SUPPORTED_LANGS.find((l) => l.code === lng) ?? SUPPORTED_LANGS[0];
    document.documentElement.setAttribute("lang", meta.htmlLang);
  };
  apply(i18n.language || "te");
  i18n.on("languageChanged", apply);
}

export default i18n;
