"use client";

import { useState } from "react";
import { Download, Eye, Share2, Info } from "lucide-react";

export function PdfActions({
  projectId,
  kind,
  from,
  to,
  categoryId,
  categoryName,
  vendorId,
  vendorName,
  workerId,
  workerName,
  stageId,
  stageName,
}: {
  projectId: string;
  kind: string;
  from?: string;
  to?: string;
  categoryId?: string;
  categoryName?: string;
  vendorId?: string;
  vendorName?: string;
  workerId?: string;
  workerName?: string;
  stageId?: string;
  stageName?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const query = new URLSearchParams({
    projectId,
    kind,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(categoryName ? { categoryName } : {}),
    ...(vendorId ? { vendorId } : {}),
    ...(vendorName ? { vendorName } : {}),
    ...(workerId ? { workerId } : {}),
    ...(workerName ? { workerName } : {}),
    ...(stageId ? { stageId } : {}),
    ...(stageName ? { stageName } : {}),
  });
  const previewUrl = `/api/reports/pdf?${query.toString()}`;
  const downloadUrl = `${previewUrl}&download=1`;

  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setMessage(null);
    setDownloading(true);
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        setMessage(json?.error || "Could not generate the PDF. Please try again.");
        setDownloading(false);
        return;
      }
      const blob = await response.blob();
      const filename = filenameFromHeader(response.headers.get("content-disposition")) ?? `house-${kind}-report.pdf`;
      triggerDownload(blob, filename);
      setMessage("PDF downloaded successfully!");
    } catch {
      setMessage("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function share() {
    setMessage(null);
    setLoading(true);
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        setMessage(json?.error || "Could not generate the PDF.");
        setLoading(false);
        return;
      }
      const blob = await response.blob();
      const filename = filenameFromHeader(response.headers.get("content-disposition")) ?? `house-${kind}-report.pdf`;
      const file = new File([blob], filename, { type: "application/pdf" });
      const payload = {
        files: [file],
        title: "House Construction Statement",
        text: "Here is the construction expenditure statement for our house project.",
      };

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share(payload);
          setLoading(false);
          return;
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            setLoading(false);
            return;
          }
        }
      }

      triggerDownload(blob, filename);
      setMessage("PDF downloaded! You can now attach and send it on WhatsApp.");
    } catch {
      setMessage("Failed to share PDF. Please use Download button.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 hover:bg-paper-50 transition active:scale-95 shadow-2xs"
        >
          <Eye className="h-4 w-4 text-ink-400" />
          Preview
        </a>

        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 hover:bg-paper-50 transition active:scale-95 shadow-2xs cursor-pointer"
        >
          <Download className="h-4 w-4 text-ink-400" />
          {downloading ? "Generating..." : "Download PDF"}
        </button>

        <button
          type="button"
          onClick={() => void share()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-clay-700 transition active:scale-95 shadow-xs cursor-pointer"
        >
          <Share2 className="h-4 w-4" />
          {loading ? "Preparing..." : "Share / WhatsApp"}
        </button>
      </div>

      {message && (
        <p className="text-xs text-clay-800 bg-clay-50 p-2 rounded-lg border border-clay-200 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-clay-600 shrink-0" />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}

function filenameFromHeader(header: string | null) {
  if (!header) return null;
  const match = /filename="([^"]+)"/.exec(header);
  return match?.[1] ?? null;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

