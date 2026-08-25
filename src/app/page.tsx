import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Hammer,
  HardHat,
  Milestone,
  Package,
  Receipt,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { EstimateRequestForm } from "@/components/leads/estimate-request-form";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#1C1917] flex flex-col selection:bg-clay-100 selection:text-clay-900">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-30 border-b border-paper-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-700 text-white font-bold shadow-2xs">
              <Hammer className="h-5 w-5" />
            </div>
            <div>
              <span className="font-serif font-black tracking-tight text-ink-900 text-base sm:text-lg block leading-tight">
                HOUSE CONSTRUCTION
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-clay-700 block">
                Tracker & Management
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-ink-700">
            <a href="#why-different" className="hover:text-clay-700 transition">Why It&apos;s Different</a>
            <a href="#how-it-works" className="hover:text-clay-700 transition">How It Works</a>
            <a href="#demo-showcase" className="hover:text-clay-700 transition">Live Demo</a>
            <a href="#estimate" className="hover:text-clay-700 transition">Request Estimate</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-paper-300 bg-white px-3.5 py-1.5 text-xs font-bold text-ink-800 hover:bg-paper-50 transition"
            >
              Sign In
            </Link>
            <a
              href="#estimate"
              className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-clay-700 transition"
            >
              <span>Get Estimate</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Hero Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-clay-200 bg-clay-50/80 px-3.5 py-1 text-xs font-bold text-clay-800 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-clay-600" />
                <span>Next-Generation House Construction Management</span>
              </div>

              <div className="space-y-2">
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-ink-900 tracking-tight leading-[1.1]">
                  BUILD WITH <span className="text-clay-700">VISIBILITY.</span>
                </h1>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-ink-700 leading-snug">
                  Know where every rupee goes.
                </p>
              </div>

              <p className="text-sm sm:text-base text-ink-600 max-w-xl leading-relaxed">
                Track materials, daily mason labour, 20-stage construction progress, and budget variances in one transparent financial system. Built specifically for homeowners and quality-first builders.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#estimate"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 px-6 py-3.5 text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-98 transition"
                >
                  <span>Request a Construction Estimate</span>
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="#demo-showcase"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-paper-300 bg-white px-5 py-3.5 text-sm font-bold text-ink-800 hover:bg-paper-50 transition"
                >
                  <span>See How It Works</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-paper-200/80 text-xs font-medium text-ink-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>100% Itemized Bills</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Zero Mixed Labour</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Real-time PDF Reports</span>
                </div>
              </div>
            </div>

            {/* Hero Right: Live Interactive Realistic Project Preview Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-card space-y-5">
                {/* Project Header */}
                <div className="flex items-center justify-between border-b border-paper-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-clay-700 block">
                      LIVE PROJECT PREVIEW
                    </span>
                    <h3 className="font-serif text-lg font-bold text-ink-900">
                      2,400 sq.ft G+1 House
                    </h3>
                    <p className="text-[11px] text-ink-500">Pruthvi Layout • Ongoing</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      58% Progress
                    </span>
                  </div>
                </div>

                {/* Hero Numbers */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-paper-200 bg-paper-50/70 p-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 block">
                      Total Budget
                    </span>
                    <p className="font-serif text-xl font-bold text-ink-900 mt-0.5">₹42,00,000</p>
                    <span className="text-[10px] text-ink-400">Planned allocation</span>
                  </div>

                  <div className="rounded-2xl border border-clay-200 bg-clay-50/50 p-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-clay-800 block">
                      Total Spent
                    </span>
                    <p className="font-serif text-xl font-bold text-ink-900 mt-0.5">₹24,60,000</p>
                    <span className="text-[10px] font-bold text-clay-700">58.5% used</span>
                  </div>
                </div>

                {/* Material vs Labour Split */}
                <div className="space-y-2 rounded-2xl border border-paper-200 p-3.5 bg-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-600 block">
                    Strict Spending Split
                  </span>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-medium">
                      <span className="flex items-center gap-1.5 text-ink-700">
                        <Package className="h-3.5 w-3.5 text-clay-600" />
                        <span>Material (Cement, Steel, Sand...)</span>
                      </span>
                      <span className="font-bold text-ink-900">₹17,20,000</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-paper-100 overflow-hidden">
                      <div className="h-full bg-clay-600 rounded-full" style={{ width: "70%" }} />
                    </div>

                    <div className="flex items-center justify-between font-medium pt-1">
                      <span className="flex items-center gap-1.5 text-ink-700">
                        <HardHat className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Labour (Masons, Bar-benders...)</span>
                      </span>
                      <span className="font-bold text-ink-900">₹5,80,000</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-paper-100 overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: "24%" }} />
                    </div>

                    <div className="flex items-center justify-between font-medium pt-1">
                      <span className="flex items-center gap-1.5 text-ink-500">
                        <Wallet className="h-3.5 w-3.5 text-ink-400" />
                        <span>Other (Machinery, Approvals)</span>
                      </span>
                      <span className="font-bold text-ink-900">₹1,60,000</span>
                    </div>
                  </div>
                </div>

                {/* Active Milestone */}
                <div className="flex items-center justify-between rounded-xl bg-paper-100/70 px-3.5 py-2.5 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-clay-700" />
                    <span>Current Stage: Roof Slab Casting</span>
                  </div>
                  <span className="text-clay-700 font-bold">Stage 6 of 20</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: WHY THIS IS DIFFERENT */}
      <section id="why-different" className="border-t border-paper-200/80 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="rounded-md bg-clay-100 px-2.5 py-1 text-xs font-bold text-clay-800 uppercase tracking-wider">
              Traditional Contractor vs. Transparent Construction
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900">
              Why Building With Visibility Changes Everything
            </h2>
            <p className="text-xs sm:text-sm text-ink-600">
              Most homeowners suffer from hidden costs, fuzzy WhatsApp updates, and mixed material/labour bills. Here is how we eliminate the guesswork.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-paper-200 bg-paper-50/50 p-6 space-y-3 hover:border-clay-300 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-100 text-clay-700">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-ink-900">Transparent Costing</h3>
              <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                Every single cement bag, steel rod, and truckload of sand is logged with exact rate, quantity, supplier, and bill photo. Zero hidden markups.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-paper-200 bg-paper-50/50 p-6 space-y-3 hover:border-clay-300 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <HardHat className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-ink-900">Strict Labour Separation</h3>
              <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                Cement purchases and mason wages are never mixed together. Daily wages (workers × days × rate) and lump-sum contracts stay 100% auditable.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-paper-200 bg-paper-50/50 p-6 space-y-3 hover:border-clay-300 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-100 text-clay-700">
                <Milestone className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-ink-900">20-Stage Sequential Milestones</h3>
              <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                Track progress truthfully from Planning & Foundation to Flooring, Woodwork, Painting, and Gruhapravesham. Progress is never guessed.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-2xl border border-paper-200 bg-paper-50/50 p-6 space-y-3 hover:border-clay-300 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-ink-900">Real-Time Budget Control</h3>
              <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                Instant warnings when structural steel, tiles, or plumbing are approaching or exceeding planned limits so you prevent cost overruns early.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="rounded-2xl border border-paper-200 bg-paper-50/50 p-6 space-y-3 hover:border-clay-300 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-100 text-clay-700">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-ink-900">Bank-Ready PDF Reports</h3>
              <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                Generate professional itemized expenditure summaries, trade matrices, and vendor ledgers formatted in Indian currency to share on WhatsApp or with banks.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="rounded-2xl border border-paper-200 bg-paper-50/50 p-6 space-y-3 hover:border-clay-300 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-ink-900">Blueprint & Photo Storage</h3>
              <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                Keep architectural CAD drawings, structural reinforcement details, municipal sanctions, and site inspection photos organized in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section: HOW IT WORKS */}
      <section id="how-it-works" className="border-t border-paper-200/80 bg-[#F7F6F2] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="rounded-md bg-clay-100 px-2.5 py-1 text-xs font-bold text-clay-800 uppercase tracking-wider">
              Methodical Execution
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900">
              5 Steps to Building with Absolute Confidence
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-5">
            {[
              { num: "01", title: "Plan", desc: "Define built-up area, budget limits, and upload architectural & structural drawings." },
              { num: "02", title: "Build", desc: "Execute site preparation, excavation, RCC column frame, masonry, and finishing." },
              { num: "03", title: "Track", desc: "Record every material invoice and daily mason attendance in 15 seconds on mobile." },
              { num: "04", title: "Review", desc: "Monitor work-wise cost matrix, budget variances, and stage completion milestones." },
              { num: "05", title: "Complete", desc: "Handover with 100% organized financial ledgers, warranty records, and final audit." },
            ].map((step) => (
              <div key={step.num} className="rounded-2xl border border-paper-200 bg-white p-5 space-y-2 shadow-2xs">
                <span className="font-serif text-3xl font-bold text-clay-600 block">{step.num}</span>
                <h4 className="font-serif text-base font-bold text-ink-900">{step.title}</h4>
                <p className="text-xs text-ink-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Section: PROJECT SHOWCASE & DEMO */}
      <section id="demo-showcase" className="border-t border-paper-200/80 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="rounded-md bg-clay-100 px-2.5 py-1 text-xs font-bold text-clay-800 uppercase tracking-wider">
                Interactive Showcase
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 mt-2">
                Work-Wise Cost Transparency Matrix
              </h2>
              <p className="text-xs sm:text-sm text-ink-600 mt-1">
                See exactly how materials and labour combine for every major construction trade.
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-paper-50 px-4 py-2 text-xs font-bold text-ink-800 hover:bg-paper-100 transition"
            >
              <span>Explore Live Dashboard Demo</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Trade Matrix Table Preview */}
          <div className="rounded-2xl border border-paper-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper-50 text-ink-600 font-bold uppercase tracking-wider border-b border-paper-200">
                  <tr>
                    <th className="px-4 py-3">Construction Trade / Work Area</th>
                    <th className="px-4 py-3">Material Purchases</th>
                    <th className="px-4 py-3">Labour & Wages</th>
                    <th className="px-4 py-3 text-right">Combined Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-100 font-medium">
                  {[
                    { trade: "RCC / Foundation Structure", mat: "₹7,28,000", lab: "₹2,36,000", total: "₹9,64,000" },
                    { trade: "Cement / Block Masonry", mat: "₹3,75,300", lab: "₹2,61,000", total: "₹6,36,300" },
                    { trade: "Flooring, Granite & Tiles", mat: "₹3,43,900", lab: "₹1,08,500", total: "₹4,52,400" },
                    { trade: "Teak Woodwork & Doors", mat: "₹2,53,000", lab: "₹95,000", total: "₹3,48,000" },
                    { trade: "Electrical Conduit & Fixtures", mat: "₹1,70,100", lab: "₹85,000", total: "₹2,55,100" },
                  ].map((row) => (
                    <tr key={row.trade} className="hover:bg-paper-50/50 transition">
                      <td className="px-4 py-3.5 font-bold text-ink-900">{row.trade}</td>
                      <td className="px-4 py-3.5 text-clay-800">{row.mat}</td>
                      <td className="px-4 py-3.5 text-emerald-800">{row.lab}</td>
                      <td className="px-4 py-3.5 font-serif font-bold text-ink-900 text-right">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section: LEAD CAPTURE / REQUEST ESTIMATE */}
      <section id="estimate" className="border-t border-paper-200/80 bg-[#F7F6F2] py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <EstimateRequestForm />
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-paper-200/80 bg-white py-10 text-xs text-ink-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-clay-700 text-white font-bold">
              <Hammer className="h-4 w-4" />
            </div>
            <span className="font-serif font-bold text-ink-900">HOUSE CONSTRUCTION TRACKER</span>
          </div>

          <p className="text-center sm:text-right">
            Build with Visibility. Know where every rupee goes.
          </p>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-clay-700 transition">Sign In</Link>
            <Link href="/register" className="hover:text-clay-700 transition">Create Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
