"use client";

import { useMemo, useState } from "react";
import { Search, AlertTriangle, Check } from "lucide-react";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

type BudgetRow = {
  id: string;
  name: string;
  planned: string;
  actual: string;
  variance: string;
  isOver: boolean;
};

export function CategoryBudgetsTable({ items }: { items: BudgetRow[] }) {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const filtered = useMemo(() => {
    return items.filter((row) =>
      query ? row.name.toLowerCase().includes(query.toLowerCase()) : true
    );
  }, [items, query]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900">
            Specific Item & Trade Limits
          </h2>
          <p className="text-xs text-ink-500">
            Limits set on Cement, Steel, Sand, Tiles, Plumbing, etc.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search category limits..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-paper-300 bg-paper-50 py-2 pl-9 pr-3 text-xs font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-paper-100 text-[11px] font-bold uppercase tracking-wider text-ink-500 border-b border-paper-200">
            <tr>
              <th className="px-4 py-3">Category / Item</th>
              <th className="px-4 py-3">Planned Limit</th>
              <th className="px-4 py-3">Actual Spent</th>
              <th className="px-4 py-3">Variance</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-100">
            {paginatedRows.map((item) => (
              <tr key={item.id} className="hover:bg-paper-50 transition">
                <td className="px-4 py-3 font-bold text-ink-900 text-xs">{item.name}</td>
                <td className="px-4 py-3 text-xs text-ink-700">{item.planned}</td>
                <td className="px-4 py-3 text-xs font-semibold text-ink-900">{item.actual}</td>
                <td className="px-4 py-3 text-xs text-ink-700">{item.variance}</td>
                <td className="px-4 py-3 text-right text-xs">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold text-[11px]",
                      item.isOver
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    )}
                  >
                    {item.isOver ? (
                      <>
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                        <span>Over Budget</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Within Budget</span>
                      </>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <TablePagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 8, 15, 25]}
        />
      )}
    </div>
  );
}
