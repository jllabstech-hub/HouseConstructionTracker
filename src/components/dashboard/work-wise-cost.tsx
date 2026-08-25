"use client";

import { formatINR } from "@/lib/money";
import { useLanguage } from "@/context/language-context";

export type WorkWiseRow = {
  name: string;
  material: number;
  labour: number;
  total: number;
};

export function WorkWiseCost({ rows }: { rows: WorkWiseRow[] }) {
  const { language } = useLanguage();

  const validRows = rows.filter((r) => r.total > 0);

  if (validRows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-4">
      <div>
        <h2 className="font-display text-base sm:text-lg font-bold text-ink-900 leading-tight">
          {language === "te" ? "పని వారీగా అయిన ఖర్చు ఎంత?" : "What did each type of work cost?"}
        </h2>
        <p className="text-xs text-ink-500 mt-0.5">
          {language === "te"
            ? "ప్రతి పనికి సామాగ్రి మరియు కూలీ ఖర్చుల మొత్తం వివరాలు"
            : "Material and labour combined breakdown for each major work category"}
        </p>
      </div>

      <div className="divide-y divide-paper-100 border-t border-paper-100">
        {validRows.slice(0, 6).map((row) => (
          <div key={row.name} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-ink-900">{row.name}</p>
              <div className="flex items-center gap-3 text-xs text-ink-500 mt-0.5">
                <span>
                  {language === "te" ? "సామాగ్రి:" : "Material:"}{" "}
                  <strong className="text-ink-700 font-semibold">{formatINR(row.material)}</strong>
                </span>
                <span>•</span>
                <span>
                  {language === "te" ? "కూలీ:" : "Labour:"}{" "}
                  <strong className="text-ink-700 font-semibold">{formatINR(row.labour)}</strong>
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold text-ink-400 block sm:hidden">
                {language === "te" ? "మొత్తం" : "Total"}
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
