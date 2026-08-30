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
    <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto py-4 sm:py-8 px-4 text-center">
      <div className="mx-auto mb-3.5 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-clay-100 text-clay-700 shadow-xs">
        <Building2 className="h-6 w-6 sm:h-7 sm:w-7" />
      </div>

      <div className="space-y-1 mb-5">
        <h2 className="font-display text-lg sm:text-xl font-bold text-ink-900 leading-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-ink-600 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full sm:w-auto">
        <Link
          href="/projects/new"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-clay-600 hover:bg-clay-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Create New Project</span>
        </Link>
        <Link
          href="/projects"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-paper-300 bg-white hover:bg-paper-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-ink-800 shadow-2xs transition cursor-pointer"
        >
          <span>View My Houses</span>
          <ArrowRight className="h-3.5 w-3.5 text-ink-500" />
        </Link>
      </div>
    </div>
  );
}
