"use client";

import React, { createContext, useContext } from "react";
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
  const language: Language = "en";
  const setLanguage = () => {};
  const toggleLanguage = () => {};
  const t = TRANSLATIONS.en;
  const getStageName = (stageName: string, short: boolean = false) => {
    return getStageLocalized(stageName, "en", short);
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
