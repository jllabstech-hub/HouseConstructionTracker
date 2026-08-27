import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { User, Building2, Receipt, Shield, Plus, ArrowRight, MapPin } from "lucide-react";
import { formatINR } from "@/lib/money";

export default async function SettingsPage() {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const expenseCount = await prisma.expense.count({
    where: { project: { userId: user.id } },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="border-b border-paper-200/80 pb-4">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
          Settings & Account
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
          Manage your homeowner profile and construction tracker defaults
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-paper-100 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-100 text-clay-800 font-bold">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-ink-900">{user.name}</h2>
            <p className="text-xs text-ink-500">{user.email}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-xl border border-paper-200 bg-paper-50/50 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink-700 font-semibold">
              <Building2 className="h-4 w-4 text-clay-600" />
              <span>House Projects</span>
            </div>
            <span className="font-bold text-ink-900">{projects.length}</span>
          </div>

          <div className="rounded-xl border border-paper-200 bg-paper-50/50 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink-700 font-semibold">
              <Receipt className="h-4 w-4 text-clay-600" />
              <span>Recorded Expenses</span>
            </div>
            <span className="font-bold text-ink-900">{expenseCount}</span>
          </div>
        </div>
      </div>

      {/* House Projects List & Add Button */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-ink-900">
            <Building2 className="h-5 w-5 text-clay-600" />
            <h2 className="font-display text-base font-bold">My House Projects</h2>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 hover:bg-clay-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add New House</span>
          </Link>
        </div>

        <div className="divide-y divide-paper-100 rounded-xl border border-paper-200 bg-paper-50/40 overflow-hidden">
          {projects.map((p) => (
            <Link
              key={p.id}
              href="/projects"
              className="flex items-center justify-between p-3.5 hover:bg-paper-100/60 transition group text-left"
            >
              <div className="min-w-0">
                <p className="font-bold text-sm text-ink-900 group-hover:text-clay-800 transition truncate flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-clay-600 shrink-0" />
                  <span>{p.name}</span>
                </p>
                {p.location && (
                  <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="h-3 w-3 text-clay-600 shrink-0" />
                    <span>{p.location}</span>
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-ink-900 block">{formatINR(p.totalBudget)}</span>
                <span className="text-[10px] font-semibold text-clay-700 flex items-center gap-1 justify-end">
                  <span>Manage</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Security & Data Privacy Card */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-ink-900">
          <Shield className="h-5 w-5 text-clay-600" />
          <h2 className="font-display text-base font-bold">Data Privacy & Security</h2>
        </div>
        <p className="text-xs text-ink-500 leading-relaxed">
          All financial figures, vendor receipts, and architectural blueprints are securely stored and encrypted.
          Only your authenticated account can access this workspace.
        </p>
      </div>
    </div>
  );
}
