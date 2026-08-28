"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, TRANSLATIONS, getStageLocalized } from "@/lib/i18n/translations";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (typeof TRANSLATIONS)["en"];
  getStageName: (stageName: string, short?: boolean) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("app_language") as Language | null;
      if (savedLang === "te" || savedLang === "en") {
        setLanguageState(savedLang);
        document.documentElement.lang = savedLang;
      }
    } catch {
      // ignore localStorage error if restricted
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("app_language", lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "te" : "en");
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const getStageName = (stageName: string, short: boolean = false) => {
    return getStageLocalized(stageName, language, short);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        getStageName,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return fallback if rendered outside provider
    return {
      language: "en" as Language,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: TRANSLATIONS.en,
      getStageName: (stageName: string, short?: boolean) => getStageLocalized(stageName, "en", short),
    };
  }
  return context;
}
