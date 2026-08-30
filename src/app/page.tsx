import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  HardHat,
  Layers,
  Receipt,
  Sparkles,
} from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-paper-50 text-ink-900 flex flex-col selection:bg-clay-100 selection:text-clay-900">
      {/* 1. Clean Top Header */}
      <header className="sticky top-0 z-30 border-b border-paper-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-600 text-white shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display font-bold text-ink-900 text-base leading-none block">
                House Construction Tracker
              </span>
              <span className="text-[10px] font-semibold text-ink-500 block mt-0.5">
                Expense & Budget Management
              </span>
            </div>
          </div>

          {/* Clean Action Buttons (Won't wrap or break on mobile) */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-paper-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-100 transition whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-clay-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-clay-700 transition whitespace-nowrap"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Focused Hero Section */}
      <main className="flex-1 flex flex-col justify-center py-10 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-clay-200 bg-clay-50 px-3.5 py-1 text-xs font-bold text-clay-800 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-clay-600" />
            <span>House Construction & Renovation Expense Tracker</span>
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-ink-900 tracking-tight leading-tight">
              Track Your Construction Expenses &amp; Budget
            </h1>
            <p className="text-sm sm:text-base text-ink-600 max-w-2xl mx-auto leading-relaxed">
              Log daily materials, mason wages, construction stage progress, vendor receipts, and budget variances in one clean, transparent tracker.
            </p>
          </div>

          {/* Direct CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-clay-600 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-95 transition"
            >
              <span>Sign In to Your Project</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-paper-300 bg-white px-5 py-3 text-sm font-bold text-ink-800 hover:bg-paper-100 transition shadow-2xs"
            >
              <span>Create New Account</span>
            </Link>
          </div>

          {/* Quick Demo Pill */}
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-clay-700 hover:text-clay-900 bg-clay-50/80 px-3 py-1 rounded-full border border-clay-200 hover:bg-clay-100 transition"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-clay-600" />
              <span>Start with your own project and categories</span>
            </Link>
          </div>

          {/* 3. Clean 4-Card Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-10 text-left">
            <div className="rounded-2xl border border-paper-200 bg-white p-5 space-y-2.5 shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-display text-sm font-bold text-ink-900">Material Purchases</h3>
              <p className="text-xs text-ink-500 leading-relaxed">
                Log cement, steel, sand, bricks, tiles, and plumbing with exact rates, units, and vendor bills.
              </p>
            </div>

            <div className="rounded-2xl border border-paper-200 bg-white p-5 space-y-2.5 shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <HardHat className="h-5 w-5" />
              </div>
              <h3 className="font-display text-sm font-bold text-ink-900">Labour &amp; Wages</h3>
              <p className="text-xs text-ink-500 leading-relaxed">
                Track daily wages (workers × days × rate) and fixed lump-sum contractor agreements separately.
              </p>
            </div>

            <div className="rounded-2xl border border-paper-200 bg-white p-5 space-y-2.5 shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-display text-sm font-bold text-ink-900">Your work stages</h3>
              <p className="text-xs text-ink-500 leading-relaxed">
                Add only the stages that match your construction plan, then track their costs and progress.
              </p>
            </div>

            <div className="rounded-2xl border border-paper-200 bg-white p-5 space-y-2.5 shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-50 text-clay-700">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="font-display text-sm font-bold text-ink-900">Receipts &amp; Reports</h3>
              <p className="text-xs text-ink-500 leading-relaxed">
                Upload bill receipts, store architectural drawings, and export itemized financial PDF reports.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Minimalist Clean Footer */}
      <footer className="border-t border-paper-200/80 bg-white py-6 text-xs text-ink-500">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-clay-600" />
            <span className="font-bold text-ink-800">House Construction Tracker</span>
          </div>

          <p className="text-center text-xs text-ink-400">
            Simple, private expense &amp; budget tracking for home construction.
          </p>

          <div className="flex items-center gap-3 font-semibold">
            <Link href="/login" className="hover:text-clay-700 transition">Sign In</Link>
            <span>•</span>
            <Link href="/register" className="hover:text-clay-700 transition">Create Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
