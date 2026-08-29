"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Building2,
  ChevronDown,
  FileText,
  Files,
  HardHat,
  Home,
  LogOut,
  Menu,
  Milestone,
  MoreHorizontal,
  Package,
  Plus,
  Receipt,
  Search,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { cn } from "@/lib/utils";
import { switchProject } from "@/lib/actions/projects";
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
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [, start] = useTransition();

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

  const primaryNav = [
    { href: "/dashboard", label: "Home", icon: Home, active: isHomeActive },
    { href: "/expenses", label: "Expenses", icon: Receipt, active: isExpensesActive },
    { href: "/stages", label: "Construction", icon: Milestone, active: isStagesActive },
    { href: "/budget", label: "Budget", icon: Wallet, active: isBudgetActive },
    { href: "/reports", label: "Reports", icon: FileText, active: isReportsActive },
  ];

  const moreNav = [
    { href: "/projects", label: "My Houses", icon: Building2, active: pathname.startsWith("/projects") },
    { href: "/phonedirectory", label: "Phone Directory", icon: Users, active: pathname === "/phonedirectory" || pathname === "/masters" },
    { href: "/documents", label: "Documents", icon: Files, active: pathname === "/documents" },
  ];

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch {
      // ignore
    }
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-paper-50 flex flex-col text-ink-900">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-paper-200 bg-white px-4 py-2.5 lg:hidden shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-clay-600 text-white">
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
              House Construction
            </p>
            <p className="text-sm font-bold text-ink-900 truncate">
              {activeProject?.name ?? "My House"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Global Search Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-paper-300 bg-paper-50 text-ink-700 hover:bg-paper-100 transition active:scale-95 shadow-2xs"
            title="Search (Ctrl+K)"
            aria-label="Search"
          >
            <Search className="h-4 w-4 text-clay-600" />
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
                  HOUSE CONSTRUCTION
                </h1>
                <p className="text-[10px] text-ink-400 font-medium">Tracker & Budget</p>
              </div>
            </div>
          </div>

          {/* Project Switcher Dropdown */}
          <div className="mb-4">
            <label className="sr-only" htmlFor="desktop-project-select">
              Select Active House Project
            </label>
            <div className="relative">
              <select
                id="desktop-project-select"
                aria-label="Select Active House Project"
                className="w-full appearance-none rounded-xl border border-paper-200 bg-paper-50/80 px-2.5 py-1.5 pr-7 text-xs font-semibold text-ink-800 hover:bg-paper-100 focus:border-clay-500 focus:outline-none transition cursor-pointer"
                value={activeProjectId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "new") {
                    window.location.href = "/projects/new";
                  } else if (val) {
                    start(async () => {
                      await switchProject(val);
                    });
                  }
                }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value="new">+ Create New Project...</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            </div>
          </div>

          {/* Primary Navigation Links */}
          <nav className="space-y-1 flex-1 overflow-y-auto pr-1 scrollbar-thin" aria-label="Primary Navigation">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition group",
                    item.active
                      ? "bg-clay-600 text-white shadow-xs font-bold"
                      : "text-ink-600 hover:bg-paper-100 hover:text-ink-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition",
                      item.active ? "text-white" : "text-ink-400 group-hover:text-clay-600"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}

            {/* Subtle Divider */}
            <div className="pt-3 pb-1">
              <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                More
              </span>
            </div>

            {/* More Links */}
            {moreNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition group",
                    item.active
                      ? "bg-clay-600 text-white shadow-xs font-bold"
                      : "text-ink-600 hover:bg-paper-100 hover:text-ink-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition",
                      item.active ? "text-white" : "text-ink-400 group-hover:text-clay-600"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Footer (User info + Sign Out) */}
          <div className="pt-3 border-t border-paper-200/80 space-y-2">
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
                onClick={handleSignOut}
                className="rounded-lg p-1 text-ink-400 hover:bg-paper-100 hover:text-red-600 transition cursor-pointer"
                title="Sign Out"
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
                Active Project:
              </span>
              <Link
                href="/projects"
                prefetch={true}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-900 bg-paper-100 hover:bg-paper-200 px-2.5 py-1 rounded-xl border border-paper-200/80 shadow-2xs transition"
                title="Manage all house projects"
              >
                <Building2 className="h-3.5 w-3.5 text-clay-600 shrink-0" />
                <span>{activeProject?.name ?? "My House"}</span>
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
                  Search files, pages, reports (Ctrl+K)...
                </span>
                <kbd className="rounded-md border border-paper-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-ink-400 shadow-2xs">
                  Ctrl+K
                </kbd>
              </button>

              {/* Quick Record Expense CTA */}
              <Link
                href="/expenses/new"
                prefetch={true}
                className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 hover:bg-clay-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95 shrink-0"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Add Expense</span>
              </Link>
            </div>
          </header>

          {/* Main Content Viewport */}
          <main className="px-3 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Fixed 5-Item Bottom Bar: Home | Expenses | + | Reports | More */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-paper-200 bg-white px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
        aria-label="Mobile Bottom Navigation"
      >
        {/* 1. Home */}
        <Link
          href="/dashboard"
          prefetch={true}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition min-w-[50px] whitespace-nowrap",
            isHomeActive ? "text-clay-600" : "text-ink-500 hover:text-ink-800"
          )}
        >
          <Home className="h-5 w-5 shrink-0" />
          <span className="whitespace-nowrap">Home</span>
        </Link>

        {/* 2. Expenses */}
        <Link
          href="/expenses"
          prefetch={true}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition min-w-[50px] whitespace-nowrap",
            isExpensesActive ? "text-clay-600" : "text-ink-500 hover:text-ink-800"
          )}
        >
          <Receipt className="h-5 w-5 shrink-0" />
          <span className="whitespace-nowrap">Expenses</span>
        </Link>

        {/* 3. Center Prominent Plus Action (Opens Quick Add Sheet) */}
        <button
          type="button"
          onClick={() => setAddSheetOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-clay-600 text-white shadow-md hover:bg-clay-700 active:scale-95 transition shrink-0 self-center"
          title="Add Expense"
          aria-label="Add Expense"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
        </button>

        {/* 4. Reports */}
        <Link
          href="/reports"
          prefetch={true}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition min-w-[50px] whitespace-nowrap",
            isReportsActive ? "text-clay-600" : "text-ink-500 hover:text-ink-800"
          )}
        >
          <FileText className="h-5 w-5 shrink-0" />
          <span className="whitespace-nowrap">Reports</span>
        </Link>

        {/* 5. More */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition min-w-[50px] whitespace-nowrap",
            mobileDrawerOpen ? "text-clay-600" : "text-ink-500 hover:text-ink-800"
          )}
          aria-label="More Options"
        >
          <Menu className="h-5 w-5 shrink-0" />
          <span className="whitespace-nowrap">More</span>
        </button>
      </nav>

      {/* Center + Action Sheet: Add Material | Add Labour | Other Expense */}
      {addSheetOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-labelledby="add-action-sheet-title">
          <div
            className="fixed inset-0 bg-ink-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setAddSheetOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 mt-auto flex w-full flex-col rounded-t-3xl bg-white shadow-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-paper-200 pb-3">
              <div>
                <h2 id="add-action-sheet-title" className="font-display text-base font-bold text-ink-900 leading-tight">
                  What are you recording?
                </h2>
                <p className="text-xs text-ink-500 font-medium mt-0.5">
                  Select expense type to record in 15 seconds
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddSheetOpen(false)}
                className="rounded-xl p-2 text-ink-400 hover:bg-paper-100 hover:text-ink-700 transition"
                aria-label="Close add menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 3 Quick Selection Cards */}
            <div className="space-y-2.5">
              {/* Option 1: Add Material */}
              <Link
                href="/expenses/new?type=MATERIAL"
                onClick={() => setAddSheetOpen(false)}
                className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-4 hover:bg-amber-100/60 active:scale-[0.98] transition group"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs group-hover:scale-105 transition">
                  <Package className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-950">
                    Add Material
                  </p>
                  <p className="text-xs text-amber-800/90 mt-0.5">
                    Cement, Steel, Sand, Bricks, Tiles, Electrical
                  </p>
                </div>
              </Link>

              {/* Option 2: Add Labour */}
              <Link
                href="/expenses/new?type=LABOUR"
                onClick={() => setAddSheetOpen(false)}
                className="flex items-center gap-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4 hover:bg-emerald-100/60 active:scale-[0.98] transition group"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition">
                  <HardHat className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-emerald-950">
                    Add Labour
                  </p>
                  <p className="text-xs text-emerald-800/90 mt-0.5">
                    Mason, Carpenter, Plumber, Electrician wages
                  </p>
                </div>
              </Link>

              {/* Option 3: Other Expense */}
              <Link
                href="/expenses/new?type=OTHER"
                onClick={() => setAddSheetOpen(false)}
                className="flex items-center gap-3.5 rounded-2xl border border-paper-200 bg-paper-50 p-4 hover:bg-paper-100 active:scale-[0.98] transition group"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-700 text-white shadow-xs group-hover:scale-105 transition">
                  <MoreHorizontal className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink-900">
                    Other Expense
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Borewell, Planning, JCB, Services & Transport
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile More Sheet / Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title">
          <div
            className="fixed inset-0 bg-ink-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 mt-auto flex w-full flex-col rounded-t-3xl bg-white shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-paper-200 pb-3">
              <div>
                <h2 id="mobile-more-title" className="font-display text-base font-bold text-ink-900 leading-tight">
                  More Options
                </h2>
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

            {/* Secondary Navigation Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/projects"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100 transition"
              >
                <Building2 className="h-4.5 w-4.5 text-clay-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate">Manage Houses</p>
                  <p className="text-[10px] text-ink-500 truncate">All Projects</p>
                </div>
              </Link>

              <Link
                href="/stages"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100 transition"
              >
                <Milestone className="h-4.5 w-4.5 text-clay-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate">Construction</p>
                  <p className="text-[10px] text-ink-500 truncate">20 Stages</p>
                </div>
              </Link>

              <Link
                href="/budget"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100 transition"
              >
                <Wallet className="h-4.5 w-4.5 text-clay-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate">Budget</p>
                  <p className="text-[10px] text-ink-500 truncate">Limits</p>
                </div>
              </Link>

              <Link
                href="/phonedirectory"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100 transition"
              >
                <Users className="h-4.5 w-4.5 text-clay-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate">Phone Directory</p>
                  <p className="text-[10px] text-ink-500 truncate">Directory</p>
                </div>
              </Link>

              <Link
                href="/documents"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100 transition"
              >
                <Files className="h-4.5 w-4.5 text-clay-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate">Documents</p>
                  <p className="text-[10px] text-ink-500 truncate">Plans & CAD</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={async () => {
                  setMobileDrawerOpen(false);
                  await handleSignOut();
                }}
                className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/50 p-3 text-red-700 hover:bg-red-100 transition text-left cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">Sign Out</p>
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
