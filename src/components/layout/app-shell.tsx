"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BrickWall,
  FileText,
  Hammer,
  HardHat,
  Home,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Wallet,
  X,
  Plus,
  Layers,
  Milestone,
} from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { switchProject } from "@/lib/actions/projects";
import { useLanguage } from "@/context/language-context";
import { Globe } from "lucide-react";

export function AppShell({
  children,
  userName,
  projects,
  activeProjectId,
}: {
  children: React.ReactNode;
  userName: string;
  projects: { id: string; name: string }[];
  activeProjectId: string | null;
}) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [, start] = useTransition();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();

  const isExpensesActive =
    pathname.startsWith("/expenses") && pathname !== "/expenses/new";
  const isAddActive = pathname === "/expenses/new";
  const expensePath = pathname.split("/").filter(Boolean);
  const isExpenseComposer =
    expensePath[0] === "expenses" &&
    expensePath.length === 2 &&
    expensePath[1] !== "material" &&
    expensePath[1] !== "labour";

  const mainNav = [
    { href: "/dashboard", label: t.nav.overview, icon: Home, desc: language === "te" ? "ఖర్చు & లెక్కలు" : "Spent, left & charts" },
    { href: "/stages", label: t.nav.stages, icon: Milestone, desc: language === "te" ? "20 దశల వరుస క్రమం" : "20 sequential stages" },
    { href: "/expenses", label: t.nav.expenses, icon: ReceiptText, desc: language === "te" ? "పాస్‌బుక్ & బిల్లులు" : "Passbook & bills" },
    { href: "/expenses/new", label: t.nav.addExpense, icon: Hammer, desc: language === "te" ? "బిల్లు / కూలీ నమోదు" : "Record bill / wage" },
    { href: "/documents", label: t.nav.documents, icon: Layers, desc: language === "te" ? "ప్లాన్లు & ఎలివేషన్" : "Plans & 3D elevations" },
    { href: "/reports", label: t.nav.reports, icon: FileText, desc: language === "te" ? "వాట్సాప్ & PDF" : "Share on WhatsApp" },
    { href: "/budget", label: t.nav.budget, icon: Wallet, desc: language === "te" ? "పరిమితుల ట్రాకింగ్" : "Track limits" },
  ];

  const secondaryNav = [
    { href: "/masters", label: t.nav.shopsWorkers, icon: HardHat, desc: language === "te" ? "వెండర్లు & మేస్త్రీలు" : "Vendors & masons" },
    { href: "/projects", label: t.nav.myHouses, icon: BrickWall, desc: language === "te" ? "అంతస్తులు & దశలు" : "Floors & stages" },
    { href: "/settings", label: t.nav.settings, icon: Settings, desc: language === "te" ? "ఖాతా వివరాలు" : "Account info" },
  ];

  return (
    <div className="min-h-screen bg-paper-50 flex flex-col">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-paper-200 bg-white/95 px-3.5 py-2.5 backdrop-blur lg:hidden shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-600 text-white shadow-xs font-bold text-base">
            🏠
          </div>
          <div>
            <p className="font-display text-sm font-bold text-ink-900 leading-tight">{t.appTitle}</p>
            <p className="text-[11px] text-ink-500 font-medium truncate max-w-[130px]">
              {projects.find((p) => p.id === activeProjectId)?.name ?? (language === "te" ? "నా ఇల్లు" : "My House")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Mobile Language Switch Button */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 rounded-xl border border-clay-300 bg-clay-50 px-2.5 py-1 text-xs font-bold text-clay-800 shadow-2xs hover:bg-clay-100 transition active:scale-95"
            title="Change language / భాష మార్చండి"
          >
            <Globe className="h-3.5 w-3.5 text-clay-600" />
            <span>{language === "en" ? "తెలుగు" : "EN"}</span>
          </button>

          {projects.length > 1 && (
            <select
              className="rounded-lg border border-paper-300 bg-paper-50 px-2 py-1 text-xs font-medium text-ink-700 max-w-[100px] truncate"
              value={activeProjectId ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                start(() => void switchProject(id));
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-paper-200 bg-paper-50 text-ink-700"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open more menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 lg:grid lg:grid-cols-[270px_1fr]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-paper-200 lg:bg-white lg:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay-600 text-white shadow-xs text-xl">
                🏠
              </div>
              <div>
                <p className="font-display text-xl font-bold text-ink-900">{t.appTitle}</p>
                <p className="text-xs text-clay-700 font-medium">{t.appSubtitle}</p>
              </div>
            </div>
          </div>

          {/* Desktop Bilingual Toggle */}
          <div className="mb-4 flex items-center justify-between rounded-xl bg-paper-100 p-1 border border-paper-200">
            <span className="flex items-center gap-1.5 px-2 text-xs font-bold text-ink-600">
              <Globe className="h-3.5 w-3.5 text-clay-600" />
              {t.language}:
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-bold transition",
                  language === "en"
                    ? "bg-white text-clay-700 shadow-xs border border-paper-200"
                    : "text-ink-500 hover:text-ink-800"
                )}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("te")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-bold transition",
                  language === "te"
                    ? "bg-clay-600 text-white shadow-xs"
                    : "text-ink-500 hover:text-ink-800"
                )}
              >
                తెలుగు
              </button>
            </div>
          </div>

          {projects.length > 0 && (
            <div className="mb-4 rounded-2xl bg-paper-50 p-2.5 border border-paper-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1 px-1">
                {t.activeProject}
              </label>
              <select
                className="w-full rounded-xl border border-paper-300 bg-white px-3 py-2 text-sm font-semibold text-ink-800 shadow-xs focus:ring-2 focus:ring-clay-500"
                value={activeProjectId ?? ""}
                onChange={(event) => {
                  const id = event.target.value;
                  start(() => void switchProject(id));
                }}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Add Button */}
          <Link
            href="/expenses/new"
            className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-clay-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-clay-700 transition"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            {t.recordBillOrWages}
          </Link>

          <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
            <p className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">
              {t.nav.mainMenu}
            </p>
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/expenses"
                  ? isExpensesActive
                  : item.href === "/expenses/new"
                    ? isAddActive
                    : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-clay-600 text-white font-semibold shadow-xs"
                      : "text-ink-700 hover:bg-paper-100 hover:text-ink-900",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-ink-500")} />
                  <div className="flex-1">
                    <p className="leading-tight">{item.label}</p>
                  </div>
                </Link>
              );
            })}

            <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">
              {t.nav.management}
            </p>
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-1.5 text-sm font-medium transition",
                    isActive
                      ? "bg-paper-200 text-ink-900 font-semibold"
                      : "text-ink-600 hover:bg-paper-100 hover:text-ink-900",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-ink-400" />
                  <span className="leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-paper-200 pt-3 mt-auto">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-clay-100 font-bold text-clay-800 text-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-900">{userName}</p>
                  <p className="text-[11px] text-ink-400">Owner</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-paper-100 hover:text-red-600 transition"
                title={t.nav.signOut}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={cn("px-4 py-5 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto", isExpenseComposer ? "pb-24 lg:pb-12" : "pb-28 lg:pb-12")}>
          {children}
        </main>
      </div>

      {!isExpenseComposer ? (
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-paper-300 bg-white/98 px-2 py-2 backdrop-blur lg:hidden shadow-lg">
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1 text-[11px] font-medium transition",
            pathname === "/dashboard" ? "text-clay-700 font-bold" : "text-ink-500",
          )}
        >
          <Home className="h-5 w-5" />
          <span>{t.nav.home}</span>
        </Link>

        <Link
          href="/expenses"
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1 text-[11px] font-medium transition",
            isExpensesActive ? "text-clay-700 font-bold" : "text-ink-500",
          )}
        >
          <ReceiptText className="h-5 w-5" />
          <span>{t.nav.expenses}</span>
        </Link>

        {/* Highlighted Middle Add Button */}
        <Link
          href="/expenses/new"
          className="flex -mt-5 h-13 w-13 flex-col items-center justify-center rounded-full bg-clay-600 text-white shadow-lg ring-4 ring-white active:scale-95 transition"
        >
          <Plus className="h-6 w-6 stroke-[3]" />
          <span className="sr-only">{t.nav.addExpense}</span>
        </Link>

        <Link
          href="/reports"
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1 text-[11px] font-medium transition",
            pathname.startsWith("/reports") ? "text-clay-700 font-bold" : "text-ink-500",
          )}
        >
          <FileText className="h-5 w-5" />
          <span>{t.nav.reports}</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1 text-[11px] font-medium transition",
            mobileDrawerOpen ? "text-clay-700 font-bold" : "text-ink-500",
          )}
        >
          <Menu className="h-5 w-5" />
          <span>{t.nav.more}</span>
        </button>
      </nav>
      ) : null}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs lg:hidden animate-fade-in">
          <div className="rounded-t-3xl bg-white p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-paper-200 pb-3">
              <div>
                <p className="font-display text-lg font-bold text-ink-900">{t.nav.allSections}</p>
                <p className="text-xs text-ink-500">{t.nav.allSectionsSub}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-full p-2 text-ink-500 hover:bg-paper-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Drawer Language Switcher */}
            <div className="flex items-center justify-between rounded-2xl bg-paper-100 p-2.5 border border-paper-200">
              <span className="flex items-center gap-2 text-xs font-bold text-ink-700">
                <Globe className="h-4 w-4 text-clay-600" />
                {t.language} / భాష:
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={cn(
                    "rounded-xl px-3 py-1 text-xs font-bold transition",
                    language === "en"
                      ? "bg-white text-clay-700 shadow-xs border border-paper-200"
                      : "text-ink-600 hover:text-ink-900"
                  )}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("te")}
                  className={cn(
                    "rounded-xl px-3 py-1 text-xs font-bold transition",
                    language === "te"
                      ? "bg-clay-600 text-white shadow-xs"
                      : "text-ink-600 hover:text-ink-900"
                  )}
                >
                  తెలుగు
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/stages"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100"
              >
                <Milestone className="h-5 w-5 text-clay-600" />
                <div>
                  <p className="text-sm font-bold text-ink-900">{t.nav.stages}</p>
                  <p className="text-[11px] text-ink-500">{language === "te" ? "20 నిర్మాణ దశలు" : "20 House Stages"}</p>
                </div>
              </Link>

              <Link
                href="/documents"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100"
              >
                <Layers className="h-5 w-5 text-clay-600" />
                <div>
                  <p className="text-sm font-bold text-ink-900">{t.nav.documents}</p>
                  <p className="text-[11px] text-ink-500">{language === "te" ? "ప్లాన్లు & 3D ఎలివేషన్" : "Plans & 3D Elevation"}</p>
                </div>
              </Link>

              <Link
                href="/budget"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100"
              >
                <Wallet className="h-5 w-5 text-clay-600" />
                <div>
                  <p className="text-sm font-bold text-ink-900">{t.nav.budget}</p>
                  <p className="text-[11px] text-ink-500">{language === "te" ? "ప్లాన్ vs ఖర్చు" : "Planned vs Actual"}</p>
                </div>
              </Link>

              <Link
                href="/masters"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100"
              >
                <HardHat className="h-5 w-5 text-clay-600" />
                <div>
                  <p className="text-sm font-bold text-ink-900">{t.nav.shopsWorkers}</p>
                  <p className="text-[11px] text-ink-500">{language === "te" ? "షాపులు & మేస్త్రీలు" : "Vendors & Masons"}</p>
                </div>
              </Link>

              <Link
                href="/projects"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100"
              >
                <BrickWall className="h-5 w-5 text-clay-600" />
                <div>
                  <p className="text-sm font-bold text-ink-900">{t.nav.myHouses}</p>
                  <p className="text-[11px] text-ink-500">{language === "te" ? "అంతస్తులు & దశలు" : "Floors & Stages"}</p>
                </div>
              </Link>

              <Link
                href="/settings"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100"
              >
                <Settings className="h-5 w-5 text-clay-600" />
                <div>
                  <p className="text-sm font-bold text-ink-900">{t.nav.settings}</p>
                  <p className="text-[11px] text-ink-500">{language === "te" ? "ఖాతా వివరాలు" : "Account Details"}</p>
                </div>
              </Link>
            </div>

            <div className="pt-2 border-t border-paper-200 flex items-center justify-between">
              <span className="text-xs text-ink-500">{t.nav.loggedInAs} <b>{userName}</b></span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 p-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t.nav.signOut}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

