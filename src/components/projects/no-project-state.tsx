import Link from "next/link";
import { Building2, Plus, ArrowRight } from "lucide-react";

export function NoProjectState({
  title = "Start your house project",
  description = "Create your house construction project to start tracking stages, material expenses, labour wages, and budgets.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl mx-auto py-12 sm:py-16 px-4 text-center space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-clay-100 text-clay-700 shadow-xs">
        <Building2 className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">
          {title}
        </h2>
        <p className="text-sm text-ink-600 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/projects/new"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 hover:bg-clay-700 px-6 py-3 text-sm font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Create New Project</span>
        </Link>
        <Link
          href="/projects"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-paper-300 bg-white hover:bg-paper-50 px-5 py-3 text-sm font-bold text-ink-800 shadow-2xs transition cursor-pointer"
        >
          <span>View My Houses</span>
          <ArrowRight className="h-4 w-4 text-ink-500" />
        </Link>
      </div>
    </div>
  );
}
