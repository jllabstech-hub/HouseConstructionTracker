"use client";

import { formatINR } from "@/lib/money";

export type WorkWiseRow = {
  name: string;
  material: number;
  labour: number;
  total: number;
};

export function WorkWiseCost({ rows }: { rows: WorkWiseRow[] }) {
  const validRows = rows.filter((r) => r.total > 0);

  if (validRows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-4">
      <div>
        <h2 className="font-display text-base sm:text-lg font-bold text-ink-900 leading-tight">
          What did each type of work cost?
        </h2>
        <p className="text-xs text-ink-500 mt-0.5">
          Material and labour combined breakdown for each major work category
        </p>
      </div>

      <div className="divide-y divide-paper-100 border-t border-paper-100">
        {validRows.slice(0, 6).map((row) => (
          <div key={row.name} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-ink-900">{row.name}</p>
              <div className="flex items-center gap-3 text-xs text-ink-500 mt-0.5">
                <span>
                  Material:{" "}
                  <strong className="text-ink-700 font-semibold">{formatINR(row.material)}</strong>
                </span>
                <span>•</span>
                <span>
                  Labour:{" "}
                  <strong className="text-ink-700 font-semibold">{formatINR(row.labour)}</strong>
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold text-ink-400 block sm:hidden">
                Total
              </span>
              <p className="font-display text-base font-bold text-ink-900">
                {formatINR(row.total)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
