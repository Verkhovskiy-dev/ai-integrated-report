/*
 * I18nContext: Internationalization support for the dashboard.
 * Provides language switching (RU/EN) with localStorage persistence.
 * All UI strings are accessed via the useTranslation() hook.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { ru } from "@/i18n/ru";
import { en } from "@/i18n/en";

export type Locale = "ru" | "en";

type TranslationDict = typeof ru;

const dictionaries: Record<Locale, TranslationDict> = { ru, en };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationDict;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem("dashboard-locale");
    if (stored === "en" || stored === "ru") return stored;
  } catch {}
  return "ru";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("dashboard-locale", newLocale);
    } catch {}
  }, []);

  const t = dictionaries[locale];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
