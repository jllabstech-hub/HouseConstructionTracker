import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import {
  Building2,
  Receipt,
  Shield,
  Plus,
  ArrowRight,
  MapPin,
  Users,
  Files,
  FileText,
  Sparkles,
} from "lucide-react";
import { formatINR } from "@/lib/money";

export default async function SettingsPage() {
  const user = await requireUser();
  const activeProjectId = await getActiveProjectId(user.id);
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const expenseCount = await prisma.expense.count({
    where: { project: { userId: user.id } },
  });
  const documentCount = await prisma.projectDocument.count({
    where: { project: { userId: user.id } },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-paper-200/80 pb-4">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
          Settings & Profile
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
          Manage your homeowner profile, active construction projects, and workspace defaults
        </p>
      </div>

      {/* 1. Homeowner Profile Card */}
      <div className="rounded-3xl border border-paper-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-100 text-clay-800 font-display font-bold text-lg shadow-2xs">
              {user.name?.charAt(0).toUpperCase() ?? "H"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-ink-900">{user.name ?? "Homeowner"}</h2>
                <span className="rounded-full bg-clay-50 border border-clay-200 px-2.5 py-0.5 text-[10px] font-bold text-clay-800">
                  Homeowner Account
                </span>
              </div>
              <p className="text-xs text-ink-500 mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-2xl border border-paper-200 bg-paper-50/50 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-clay-600" /> Houses
              </span>
              <span className="font-display text-xl font-bold text-ink-900 block">{projects.length}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-paper-200 bg-paper-50/50 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-clay-600" /> Bills Logged
              </span>
              <span className="font-display text-xl font-bold text-ink-900 block">{expenseCount}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-paper-200 bg-paper-50/50 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
                <Files className="h-4 w-4 text-clay-600" /> Blueprints
              </span>
              <span className="font-display text-xl font-bold text-ink-900 block">{documentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Navigation Shortcuts */}
      <div className="rounded-3xl border border-paper-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-base font-bold text-ink-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-clay-600" /> Quick Workspace Shortcuts
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <Link
            href="/phonedirectory"
            className="flex items-center gap-3 rounded-2xl border border-paper-200 bg-paper-50/50 p-3.5 hover:bg-paper-100/70 hover:border-clay-300 transition group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-ink-900 group-hover:text-clay-800 truncate">Phone Directory</p>
              <p className="text-[11px] text-ink-500 truncate">Vendors & Workers</p>
            </div>
          </Link>

          <Link
            href="/documents"
            className="flex items-center gap-3 rounded-2xl border border-paper-200 bg-paper-50/50 p-3.5 hover:bg-paper-100/70 hover:border-clay-300 transition group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900 shrink-0">
              <Files className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-ink-900 group-hover:text-clay-800 truncate">Blueprints & Plans</p>
              <p className="text-[11px] text-ink-500 truncate">CAD & Sanctions</p>
            </div>
          </Link>

          <Link
            href="/reports"
            className="flex items-center gap-3 rounded-2xl border border-paper-200 bg-paper-50/50 p-3.5 hover:bg-paper-100/70 hover:border-clay-300 transition group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-ink-900 group-hover:text-clay-800 truncate">Bank PDF Reports</p>
              <p className="text-[11px] text-ink-500 truncate">Statements & Ledgers</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 3. My House Projects List & Add Button */}
      <div className="rounded-3xl border border-paper-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-ink-900">
            <Building2 className="h-5 w-5 text-clay-600" />
            <h2 className="font-serif text-base font-bold">My House Projects</h2>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 hover:bg-clay-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add New House</span>
          </Link>
        </div>

        <div className="divide-y divide-paper-100 rounded-2xl border border-paper-200 bg-paper-50/40 overflow-hidden">
          {projects.map((p) => {
            const isActive = p.id === activeProjectId;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className={`flex items-center justify-between p-4 hover:bg-paper-100/60 transition group text-left ${
                  isActive ? "bg-clay-50/40" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-ink-900 group-hover:text-clay-800 transition truncate">
                      {p.name}
                    </p>
                    {isActive && (
                      <span className="rounded-full bg-clay-600 px-2 py-0.5 text-[9px] font-extrabold text-white uppercase tracking-wider">
                        Active House
                      </span>
                    )}
                  </div>
                  {p.location && (
                    <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="h-3 w-3 text-clay-600 shrink-0" />
                      <span>{p.location}</span>
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-ink-900 block">{formatINR(p.totalBudget)}</span>
                  <span className="text-[11px] font-semibold text-clay-700 flex items-center gap-1 justify-end mt-0.5">
                    <span>Manage</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Security & Data Privacy Card */}
      <div className="rounded-3xl border border-paper-200 bg-white p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-ink-900">
          <Shield className="h-5 w-5 text-clay-600" />
          <h2 className="font-serif text-base font-bold">Data Privacy & Storage Integrity</h2>
        </div>
        <p className="text-xs text-ink-500 leading-relaxed">
          All construction expenditures, invoices, vendor ledgers, and architectural blueprints are securely stored with project isolation.
          Only your authenticated account has access to this data.
        </p>
      </div>
    </div>
  );
}
