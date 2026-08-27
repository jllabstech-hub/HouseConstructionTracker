"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Building2,
  ChevronDown,
  FileText,
  Files,
  Globe,
  Home,
  LogOut,
  Menu,
  Milestone,
  Plus,
  Receipt,
  Search,
  Settings,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { cn } from "@/lib/utils";
import { switchProject } from "@/lib/actions/projects";
import { useLanguage } from "@/context/language-context";
import { GlobalSearchModal } from "@/components/search/global-search-modal";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [, start] = useTransition();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();

  // Keyboard shortcut: Ctrl+K / Cmd+K to open global search
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isExpensesActive =
    pathname.startsWith("/expenses") && pathname !== "/expenses/new";
  const isStagesActive = pathname.startsWith("/stages");
  const isBudgetActive = pathname.startsWith("/budget");
  const isReportsActive = pathname.startsWith("/reports");
  const isHomeActive = pathname === "/dashboard";
  const isAddActive = pathname === "/expenses/new";

  const primaryNav = [
    { href: "/dashboard", label: t.nav?.overview ?? "Home", icon: Home, active: isHomeActive },
    { href: "/expenses", label: t.nav?.expenses ?? "Expenses", icon: Receipt, active: isExpensesActive },
    { href: "/stages", label: t.nav?.stages ?? "Construction", icon: Milestone, active: isStagesActive },
    { href: "/budget", label: t.nav?.budget ?? "Budget", icon: Wallet, active: isBudgetActive },
    { href: "/reports", label: t.nav?.reports ?? "Reports", icon: FileText, active: isReportsActive },
  ];

  const moreNav = [
    { href: "/leads", label: "Inquiries & Leads", icon: Sparkles, active: pathname === "/leads" },
    { href: "/phonedirectory", label: t.nav?.shopsWorkers ?? "Phone Directory", icon: Users, active: pathname === "/phonedirectory" || pathname === "/masters" },
    { href: "/documents", label: t.nav?.documents ?? "Documents", icon: Files, active: pathname === "/documents" },
    { href: "/settings", label: t.nav?.settings ?? "Settings", icon: Settings, active: pathname === "/settings" },
  ];

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="min-h-screen bg-paper-50 flex flex-col text-ink-900">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-paper-200 bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-clay-600 text-white">
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
              {language === "te" ? "ఇంటి నిర్మాణం" : "House Construction"}
            </p>
            <p className="text-sm font-bold text-ink-900 truncate">
              {activeProject?.name ?? (language === "te" ? "నా ఇల్లు" : "My House")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Search Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-paper-300 bg-paper-50 text-ink-700 hover:bg-paper-100 transition active:scale-95 shadow-2xs"
            title="Search / ఏదైనా వెతకండి (Ctrl+K)"
            aria-label="Search"
          >
            <Search className="h-4 w-4 text-clay-600" />
          </button>

          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 rounded-lg border border-paper-300 bg-paper-50 px-2 py-1 text-xs font-bold text-ink-700 hover:bg-paper-100 transition active:scale-95"
            title="Change language / భాష మార్చండి"
          >
            <Globe className="h-3.5 w-3.5 text-clay-600" />
            <span>{language === "en" ? "తెలుగు" : "EN"}</span>
          </button>

          {/* More Menu Toggle */}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-paper-200 bg-paper-50 text-ink-700 hover:bg-paper-100 transition"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 lg:grid lg:grid-cols-[230px_1fr]">
        {/* Desktop Left Sidebar (230px wide, quiet, spacious) */}
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-paper-200 lg:bg-white lg:p-4">
          {/* Brand Header */}
          <div className="mb-4 px-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-clay-600 text-white shadow-xs">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h1 className="font-display text-sm font-bold text-ink-900 tracking-tight leading-tight">
                  {language === "te" ? "హౌస్ కన్‌స్ట్రక్షన్" : "HOUSE CONSTRUCTION"}
                </h1>
                <p className="text-[11px] text-ink-500 font-medium">
                  {language === "te" ? "ఖర్చుల లెక్కల పుస్తకం" : "Tracker & Budget"}
                </p>
              </div>
            </div>

            {/* Compact Project Switcher */}
            <div className="mt-3">
              {projects.length > 1 ? (
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-xl border border-paper-200 bg-paper-50 px-3 py-1.5 text-xs font-semibold text-ink-800 pr-7 focus:border-clay-500 focus:outline-none"
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
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-ink-400" />
                </div>
              ) : (
                <div className="rounded-xl border border-paper-200 bg-paper-50/70 px-3 py-1.5 text-xs font-semibold text-ink-800 truncate">
                  {activeProject?.name ?? (language === "te" ? "నా ఇల్లు" : "My House")}
                </div>
              )}
            </div>
          </div>

          {/* Primary Navigation Links */}
          <nav className="flex-1 space-y-1 px-1" aria-label="Main Navigation">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition",
                    item.active
                      ? "bg-clay-600 text-white shadow-xs"
                      : "text-ink-700 hover:bg-paper-100 hover:text-ink-900"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", item.active ? "text-white" : "text-ink-500 group-hover:text-ink-900")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}

            {/* Divider */}
            <div className="pt-3 pb-1">
              <div className="border-t border-paper-200/80 px-2 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                  {language === "te" ? "మరిన్ని" : "More"}
                </span>
              </div>
            </div>

            {/* Secondary Links */}
            {moreNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition",
                    item.active
                      ? "bg-clay-600 text-white shadow-xs"
                      : "text-ink-700 hover:bg-paper-100 hover:text-ink-900"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", item.active ? "text-white" : "text-ink-500 group-hover:text-ink-900")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Language Switcher & Profile Footer */}
          <div className="border-t border-paper-200 pt-3 px-1 space-y-2.5">
            {/* Language Toggle */}
            <div className="flex items-center justify-between rounded-xl bg-paper-100 p-1 border border-paper-200/80">
              <span className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-ink-600">
                <Globe className="h-3 w-3 text-clay-600" />
                {language === "te" ? "భాష" : "Lang"}:
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={cn(
                    "rounded-lg px-2 py-0.5 text-[11px] font-bold transition",
                    language === "en"
                      ? "bg-white text-clay-700 shadow-2xs"
                      : "text-ink-600 hover:text-ink-900"
                  )}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("te")}
                  className={cn(
                    "rounded-lg px-2 py-0.5 text-[11px] font-bold transition",
                    language === "te"
                      ? "bg-clay-600 text-white shadow-2xs"
                      : "text-ink-600 hover:text-ink-900"
                  )}
                >
                  తెలుగు
                </button>
              </div>
            </div>

            {/* User Profile + Logout */}
            <div className="flex items-center justify-between px-1.5 py-1">
              <div className="min-w-0 flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clay-100 text-clay-800 text-xs font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate leading-tight">{userName}</p>
                  <p className="text-[10px] text-ink-400 font-medium">Homeowner</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg p-1 text-ink-400 hover:bg-paper-100 hover:text-red-600 transition"
                title={t.nav?.signOut ?? "Sign Out"}
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Desktop Main Content Container with Top-Right Search Header */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Desktop Bar with Top-Right Global Search & Quick Actions */}
          <header className="hidden lg:flex items-center justify-between border-b border-paper-200/90 bg-white/90 backdrop-blur-md px-8 py-2.5 sticky top-0 z-20 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                {language === "te" ? "ప్రస్తుత ఇల్లు" : "Active Project"}:
              </span>
              <Link
                href="/projects"
                className="text-xs font-bold text-ink-900 bg-paper-100 hover:bg-paper-200 px-2.5 py-1 rounded-xl border border-paper-200/80 shadow-2xs transition"
                title="Manage all house projects"
              >
                🏡 {activeProject?.name ?? (language === "te" ? "నా ఇల్లు" : "My House")}
              </Link>
              <Link
                href="/projects/new"
                className="text-[11px] font-bold text-clay-700 hover:text-clay-900 bg-clay-50 hover:bg-clay-100 px-2 py-0.5 rounded-lg border border-clay-200 transition"
                title="Create another house project"
              >
                + New House
              </Link>
            </div>

            {/* Top-Right Search & Action Controls */}
            <div className="flex items-center gap-3">
              {/* Top-Right Global Search Bar Trigger */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-3 rounded-2xl border border-paper-300 bg-paper-50/90 hover:bg-white hover:border-clay-400 px-3.5 py-1.5 text-xs text-ink-600 shadow-2xs transition group w-80"
                title="Universal Search (Ctrl+K)"
              >
                <Search className="h-4 w-4 text-clay-600 group-hover:text-clay-800 shrink-0" />
                <span className="flex-1 text-left text-xs font-medium text-ink-500 truncate">
                  {language === "te" ? "వెతకండి / అడగండి (Ctrl+K)..." : "Search files, pages, reports (Ctrl+K)..."}
                </span>
                <kbd className="rounded-md border border-paper-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-ink-400 shadow-2xs">
                  Ctrl+K
                </kbd>
              </button>

              {/* Quick Record Expense CTA */}
              <Link
                href="/expenses/new"
                className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 hover:bg-clay-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95 shrink-0"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>{t.nav?.addExpense ?? "+ Add Expense"}</span>
              </Link>
            </div>
          </header>

          {/* Main Content Viewport */}
          <main className="px-4 py-5 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Fixed 5-Item Bottom Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-paper-300 bg-white/98 px-2 py-1.5 backdrop-blur lg:hidden shadow-lg"
        aria-label="Mobile Bottom Navigation"
      >
        {/* 1. Home */}
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition",
            isHomeActive ? "text-clay-600" : "text-ink-500 hover:text-ink-800"
          )}
        >
          <Home className="h-4.5 w-4.5" />
          <span>{t.nav?.overview ?? "Home"}</span>
        </Link>

        {/* 2. Expenses */}
        <Link
          href="/expenses"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition",
            isExpensesActive ? "text-clay-600" : "text-ink-500 hover:text-ink-800"
          )}
        >
          <Receipt className="h-4.5 w-4.5" />
          <span>{t.nav?.expenses ?? "Expenses"}</span>
        </Link>

        {/* 3. Center Prominent Plus Action */}
        <Link
          href="/expenses/new"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-clay-600 text-white shadow-md hover:bg-clay-700 active:scale-95 transition -mt-4 border-2 border-white"
          title={t.nav?.addExpense ?? "+ Add Expense"}
          aria-label={t.nav?.addExpense ?? "Add Expense"}
        >
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </Link>

        {/* 4. Reports */}
        <Link
          href="/reports"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition",
            isReportsActive ? "text-clay-600" : "text-ink-500 hover:text-ink-800"
          )}
        >
          <FileText className="h-4.5 w-4.5" />
          <span>{t.nav?.reports ?? "Reports"}</span>
        </Link>

        {/* 5. More */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition",
            mobileDrawerOpen ? "text-clay-600" : "text-ink-500 hover:text-ink-800"
          )}
          aria-label="More Options"
        >
          <Menu className="h-4.5 w-4.5" />
          <span>{language === "te" ? "మరిన్ని" : "More"}</span>
        </button>
      </nav>

      {/* Mobile More Sheet / Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-ink-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 mt-auto flex w-full flex-col rounded-t-3xl bg-white shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-paper-200 pb-3">
              <div>
                <p className="font-display text-base font-bold text-ink-900 leading-tight">
                  {language === "te" ? "మరిన్ని విభాగాలు" : "More Options"}
                </p>
                <p className="text-xs text-ink-500 font-medium">
                  {userName} · {activeProject?.name ?? "My House"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-paper-100 hover:text-ink-700 transition"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Language Switcher */}
            <div className="flex items-center justify-between rounded-xl bg-paper-100 p-2 border border-paper-200">
              <span className="flex items-center gap-1.5 text-xs font-bold text-ink-700">
                <Globe className="h-4 w-4 text-clay-600" />
                {language === "te" ? "భాష ఎంచుకోండి" : "Select Language"}:
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={cn(
                    "rounded-lg px-3 py-1 text-xs font-bold transition",
                    language === "en"
                      ? "bg-white text-clay-700 shadow-xs"
                      : "text-ink-600 hover:text-ink-900"
                  )}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("te")}
                  className={cn(
                    "rounded-lg px-3 py-1 text-xs font-bold transition",
                    language === "te"
                      ? "bg-clay-600 text-white shadow-xs"
                      : "text-ink-600 hover:text-ink-900"
                  )}
                >
                  తెలుగు
                </button>
              </div>
            </div>

            {/* Secondary Navigation Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/stages"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100 transition"
              >
                <Milestone className="h-4.5 w-4.5 text-clay-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate">{t.nav?.stages ?? "Construction"}</p>
                  <p className="text-[10px] text-ink-500 truncate">{language === "te" ? "దశల పురోగతి" : "20 Stages"}</p>
                </div>
              </Link>

              <Link
                href="/budget"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100 transition"
              >
                <Wallet className="h-4.5 w-4.5 text-clay-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate">{t.nav?.budget ?? "Budget"}</p>
                  <p className="text-[10px] text-ink-500 truncate">{language === "te" ? "పరిమితులు" : "Limits"}</p>
                </div>
              </Link>

              <Link
                href="/phonedirectory"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100 transition"
              >
                <Users className="h-4.5 w-4.5 text-clay-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate">{t.nav?.shopsWorkers ?? "Phone Directory"}</p>
                  <p className="text-[10px] text-ink-500 truncate">{language === "te" ? "ఫోన్ నంబర్లు" : "Directory"}</p>
                </div>
              </Link>

              <Link
                href="/documents"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100 transition"
              >
                <Files className="h-4.5 w-4.5 text-clay-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate">{t.nav?.documents ?? "Documents"}</p>
                  <p className="text-[10px] text-ink-500 truncate">{language === "te" ? "ప్లాన్లు & ఫైళ్ళు" : "Plans & CAD"}</p>
                </div>
              </Link>

              <Link
                href="/settings"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100 transition"
              >
                <Settings className="h-4.5 w-4.5 text-clay-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate">{t.nav?.settings ?? "Settings"}</p>
                  <p className="text-[10px] text-ink-500 truncate">{language === "te" ? "ఖాతా వివరాలు" : "Account"}</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/50 p-3 text-red-700 hover:bg-red-100 transition text-left"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{t.nav?.signOut ?? "Sign Out"}</p>
                  <p className="text-[10px] text-red-500 truncate">{userName}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Command / Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        projectId={activeProjectId}
      />
    </div>
  );
}
