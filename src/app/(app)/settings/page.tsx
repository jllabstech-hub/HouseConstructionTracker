import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { User, Building2, Receipt, Shield } from "lucide-react";

export default async function SettingsPage() {
  const user = await requireUser();
  const projectCount = await prisma.project.count({ where: { userId: user.id } });
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
            <span className="font-bold text-ink-900">{projectCount}</span>
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
