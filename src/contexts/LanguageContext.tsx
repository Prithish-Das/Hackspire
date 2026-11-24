import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Locale } from "../i18n/translations";

interface LanguageContextType {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number) => string;
}

const STORAGE_KEY = "recalled-language";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "bn" || saved === "hi") {
        return saved;
      }
    } catch {
      // Fallback
    }
    return "en";
  });

  const setLanguage = (lang: Locale) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore
    }
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const langDict = translations[language] || translations.en;
    let text = langDict[key] || translations.en[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(val));
      });
    }

    return text;
  };

  const getLocaleTag = (lang: Locale): string => {
    switch (lang) {
      case "bn":
        return "bn-IN";
      case "hi":
        return "hi-IN";
      case "en":
      default:
        return "en-IN";
    }
  };

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      return new Intl.DateTimeFormat(getLocaleTag(language), options || {
        day: "numeric",
        month: "short",
        year: "numeric"
      }).format(d);
    } catch {
      return String(date);
    }
  };

  const formatNumber = (num: number): string => {
    try {
      return new Intl.NumberFormat(getLocaleTag(language)).format(num);
    } catch {
      return String(num);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatDate, formatNumber }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
