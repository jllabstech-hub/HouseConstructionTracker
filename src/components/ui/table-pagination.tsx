"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showAllOption?: boolean;
  className?: string;
}

export function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showAllOption = false,
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3.5 rounded-2xl bg-white px-4 py-3 border border-paper-200 shadow-2xs text-xs",
        className
      )}
    >
      {/* 1. Item Count & Page Size Info */}
      <div className="flex flex-wrap items-center gap-3 text-ink-600 font-medium w-full sm:w-auto justify-between sm:justify-start">
        <span>
          Showing <strong className="text-ink-900 font-bold">{startItem}–{endItem}</strong> of{" "}
          <strong className="text-ink-900 font-bold">{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-ink-400">Rows:</span>
            <select
              value={showAllOption && pageSize >= totalItems ? "all" : pageSize}
              onChange={(e) => {
                onPageSizeChange(e.target.value === "all" ? totalItems : Number(e.target.value));
                onPageChange(1);
              }}
              className="rounded-lg border border-paper-300 bg-paper-50 px-2 py-1 text-xs font-bold text-ink-800 focus:border-clay-500 focus:bg-white focus:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              {showAllOption && <option value="all">All</option>}
            </select>
          </div>
        )}
      </div>

      {/* 2. Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
          className="rounded-lg p-1.5 text-ink-500 hover:bg-paper-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1 rounded-xl border border-paper-200 bg-white px-2.5 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs transition"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Prev</span>
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((page, idx) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-ink-400 font-bold">
                  …
                </span>
              );
            }
            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(Number(page))}
                className={cn(
                  "min-w-[28px] h-7 rounded-lg text-xs font-bold transition",
                  isCurrent
                    ? "bg-clay-600 text-white shadow-xs"
                    : "text-ink-700 hover:bg-paper-100"
                )}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 rounded-xl border border-paper-200 bg-white px-2.5 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs transition"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
          className="rounded-lg p-1.5 text-ink-500 hover:bg-paper-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
