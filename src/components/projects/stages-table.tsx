"use client";

import { useState } from "react";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

type StageRow = {
  id: string;
  name: string;
  status: string;
  percentageComplete: number;
  spend: string;
};

export function StagesTable({ stages }: { stages: StageRow[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const paginatedStages = stages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function getStatusBadge(status: string) {
    if (status === "COMPLETED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "IN_PROGRESS") return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-paper-100 text-ink-600 border-paper-200";
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border border-paper-200 bg-white shadow-xs">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-paper-100 text-[11px] font-bold uppercase tracking-wider text-ink-500 border-b border-paper-200">
            <tr>
              <th className="px-4 py-3">Construction Stage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3 text-right">Spend Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-100">
            {paginatedStages.map((stage) => (
              <tr key={stage.id} className="hover:bg-paper-50 transition">
                <td className="px-4 py-3 font-bold text-ink-900 text-xs">{stage.name}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-block rounded-lg px-2.5 py-0.5 text-[11px] font-bold border",
                      getStatusBadge(stage.status)
                    )}
                  >
                    {stage.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 sm:w-28 h-2 rounded-full bg-paper-200 overflow-hidden">
                      <div
                        className="h-full bg-clay-600 rounded-full"
                        style={{ width: `${stage.percentageComplete}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-ink-700">{stage.percentageComplete}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-bold text-clay-700 text-xs">
                  {stage.spend}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stages.length > pageSize && (
        <TablePagination
          currentPage={currentPage}
          totalItems={stages.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 8, 15, 25]}
        />
      )}
    </div>
  );
}
