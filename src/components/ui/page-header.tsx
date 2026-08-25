"use client";

import { useLanguage } from "@/context/language-context";

const TITLE_TRANSLATIONS: Record<string, { te: string; subTe?: string }> = {
  "Add expense": {
    te: "ఖర్చు నమోదు చేయండి",
    subTe: "సామాగ్రి కొనుగోలు లేదా కూలీల చెల్లింపును సులభంగా నమోదు చేసుకోండి.",
  },
  "Edit expense": {
    te: "ఖర్చు వివరాలు మార్చండి",
    subTe: "నమోదు చేసిన ఖర్చు వివరాలను సవరించండి.",
  },
  "All expenses": {
    te: "అన్ని ఖర్చులు & రసీదులు",
    subTe: "సామాగ్రి కొనుగోళ్లు మరియు కూలీల చెల్లింపుల పూర్తి లెక్కల పుస్తకం.",
  },
  "Material expenses": {
    te: "సామాగ్రి కొనుగోలు ఖర్చులు",
    subTe: "సిమెంట్, ఇనుము, ఇసుక మరియు ఇతర సామాగ్రి బిల్లుల వివరాలు.",
  },
  "Labour expenses": {
    te: "కూలీల చెల్లింపులు & వేతనాలు",
    subTe: "మేస్త్రీలు, కూలీలు మరియు కాంట్రాక్టర్ల రోజువారీ లేదా లంప్‌సమ్ వేతనాలు.",
  },
  "House Budget & Limits": {
    te: "ఇంటి బడ్జెట్ & పరిమితులు",
    subTe: "ప్రతి పనికి ప్లాన్ చేసిన ఖర్చును పర్యవేక్షించండి. బడ్జెట్ దాటితే వెంటనే హెచ్చరికలు కనిపిస్తాయి.",
  },
  "Masters & Directory": {
    te: "దుకాణాలు & కూలీల డైరెక్టరీ",
    subTe: "మీ హార్డ్‌వేర్ దుకాణాలు, మేస్త్రీలు, సామాగ్రి జాబితా మరియు వర్కర్ల వివరాలను ఇక్కడ నిర్వహించండి.",
  },
};

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const { language } = useLanguage();

  const localized = TITLE_TRANSLATIONS[title];
  const displayTitle = language === "te" && localized?.te ? localized.te : title;
  const displaySubtitle = language === "te" && localized?.subTe ? localized.subTe : subtitle;

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">{displayTitle}</h1>
        {displaySubtitle ? <p className="mt-1 max-w-2xl text-xs sm:text-sm text-ink-600 font-medium">{displaySubtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const { language } = useLanguage();

  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
      <h3 className="font-display text-xl text-ink-900 font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
