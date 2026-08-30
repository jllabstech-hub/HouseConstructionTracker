"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  uploadDocument,
  updateDocument,
  togglePinDocument,
  deleteDocument,
  seedSampleDocuments,
} from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  Layers,
  FileText,
  Plus,
  Pin,
  Eye,
  Download,
  Trash2,
  Edit3,
  X,
  Compass,
  Sparkles,
  Search,
  LayoutGrid,
  List,
  ShieldCheck,
  Zap,
  Camera,
  FileCheck,
  Share2,
  SlidersHorizontal,
  RotateCcw,
  MoreVertical,
  AlertCircle,
  Check,
  ChevronDown,
} from "lucide-react";

export type DocumentItem = {
  id: string;
  projectId: string;
  category: "FLOOR_PLAN" | "STRUCTURAL" | "ELEVATION" | "MEP" | "APPROVAL" | "SITE_PHOTO" | "CONTRACT" | "OTHER";
  title: string;
  description: string | null;
  floorId: string | null;
  constructionStageId: string | null;
  fileName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  version: string | null;
  isPinned: boolean;
  createdAt: Date | string;
};

const CATEGORIES = [
  {
    value: "FLOOR_PLAN",
    labelEn: "Floor Plan",
    icon: Compass,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    value: "ELEVATION",
    labelEn: "3D Elevation",
    icon: Sparkles,
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    value: "STRUCTURAL",
    labelEn: "Structural Drawing",
    icon: Layers,
    badgeColor: "bg-amber-100 text-amber-900 border-amber-200",
  },
  {
    value: "MEP",
    labelEn: "Electrical & Plumbing",
    icon: Zap,
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    value: "APPROVAL",
    labelEn: "Permit & Approval",
    icon: ShieldCheck,
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
  },
  {
    value: "SITE_PHOTO",
    labelEn: "Site Photo",
    icon: Camera,
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  {
    value: "CONTRACT",
    labelEn: "Contract & Agreement",
    icon: FileCheck,
    badgeColor: "bg-stone-200 text-stone-800 border-stone-300",
  },
  {
    value: "OTHER",
    labelEn: "Other Document",
    icon: FileText,
    badgeColor: "bg-gray-100 text-gray-800 border-gray-200",
  },
] as const;

function formatDisplayDate(dateInput: Date | string) {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return String(dateInput);
  }
}

export function DocumentsHub({
  projectId,
  documents = [],
  floors = [],
  stages = [],
}: {
  projectId: string;
  projectName?: string;
  documents?: DocumentItem[];
  floors?: { id: string; name: string }[];
  stages?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // Primary Controls
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Advanced Filters Drawer State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<string>("ALL");
  const [drawerFloor, setDrawerFloor] = useState<string>("ALL");
  const [drawerStage, setDrawerStage] = useState<string>("ALL");
  const [drawerPinned, setDrawerPinned] = useState<"ALL" | "PINNED" | "UNPINNED">("ALL");
  const [drawerDate, setDrawerDate] = useState<"ALL" | "TODAY" | "MONTH" | "LAST_MONTH">("ALL");

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedType !== "ALL" || drawerCategory !== "ALL") count++;
    if (drawerFloor !== "ALL") count++;
    if (drawerStage !== "ALL") count++;
    if (drawerPinned !== "ALL") count++;
    if (drawerDate !== "ALL") count++;
    return count;
  }, [selectedType, drawerCategory, drawerFloor, drawerStage, drawerPinned, drawerDate]);

  // Modals & Popups
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightboxDoc, setLightboxDoc] = useState<DocumentItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState<boolean>(false);
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [previewErrors, setPreviewErrors] = useState<Record<string, boolean>>({});
  const [isCustomDocCategory, setIsCustomDocCategory] = useState(false);
  const [customDocCategoryName, setCustomDocCategoryName] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (lightboxDoc) {
          setLightboxDoc(null);
        } else if (showUploadModal || editingDoc) {
          setShowUploadModal(false);
          setEditingDoc(null);
          setUploadError(null);
        }
      }
    }
    if (lightboxDoc || showUploadModal || editingDoc) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxDoc, showUploadModal, editingDoc]);

  const openEditDoc = (doc: DocumentItem) => {
    setEditingDoc(doc);
    if (doc.description && doc.description.includes("[Category:")) {
      const match = doc.description.match(/\[Category:\s*([^\]]+)\]/);
      if (match && match[1]) {
        setIsCustomDocCategory(true);
        setCustomDocCategoryName(match[1].trim());
      } else {
        setIsCustomDocCategory(false);
        setCustomDocCategoryName("");
      }
    } else {
      setIsCustomDocCategory(false);
      setCustomDocCategoryName("");
    }
  };

  const clearAllFilters = () => {
    setSearch("");
    setSelectedType("ALL");
    setDrawerCategory("ALL");
    setDrawerFloor("ALL");
    setDrawerStage("ALL");
    setDrawerPinned("ALL");
    setDrawerDate("ALL");
  };

  const allDocCategories = useMemo(() => {
    const defaultList: { value: string; labelEn: string }[] = CATEGORIES.map((c) => ({
      value: c.value,
      labelEn: c.labelEn,
    }));

    const customCats = new Set<string>();
    documents.forEach((d) => {
      if (d.description && d.description.includes("[Category:")) {
        const match = d.description.match(/\[Category:\s*([^\]]+)\]/);
        if (match && match[1]) {
          customCats.add(match[1].trim());
        }
      }
    });

    customCats.forEach((c) => {
      defaultList.push({
        value: `CUSTOM_${c}`,
        labelEn: c,
      });
    });

    return defaultList;
  }, [documents]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    const effectiveCategory = drawerCategory !== "ALL" ? drawerCategory : selectedType;

    return documents
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .filter((doc) => {
        // Category / Type
        if (effectiveCategory !== "ALL") {
          if (effectiveCategory.startsWith("CUSTOM_")) {
            const customName = effectiveCategory.replace("CUSTOM_", "").toLowerCase();
            const docCatName = (doc.description?.match(/\[Category:\s*([^\]]+)\]/)?.[1] || "").toLowerCase();
            if (docCatName !== customName) return false;
          } else {
            if (doc.category !== effectiveCategory) return false;
          }
        }

        // Floor
        if (drawerFloor !== "ALL" && doc.floorId !== drawerFloor) return false;

        // Stage
        if (drawerStage !== "ALL" && doc.constructionStageId !== drawerStage) return false;

        // Pinned
        if (drawerPinned === "PINNED" && !doc.isPinned) return false;
        if (drawerPinned === "UNPINNED" && doc.isPinned) return false;

        // Date
        if (drawerDate !== "ALL") {
          const docDate = new Date(doc.createdAt);
          const now = new Date();
          if (drawerDate === "TODAY") {
            if (docDate.toDateString() !== now.toDateString()) return false;
          } else if (drawerDate === "MONTH") {
            if (docDate.getMonth() !== now.getMonth() || docDate.getFullYear() !== now.getFullYear()) return false;
          } else if (drawerDate === "LAST_MONTH") {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            if (docDate.getMonth() !== lastMonth.getMonth() || docDate.getFullYear() !== lastMonth.getFullYear()) return false;
          }
        }

        // Search Query
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          (doc.description && doc.description.toLowerCase().includes(q)) ||
          (doc.version && doc.version.toLowerCase().includes(q)) ||
          doc.fileName.toLowerCase().includes(q)
        );
      });
  }, [documents, selectedType, drawerCategory, drawerFloor, drawerStage, drawerPinned, drawerDate, search]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocCategoryObj = (docOrCat: DocumentItem | string) => {
    if (typeof docOrCat === "string") {
      return CATEGORIES.find((c) => c.value === docOrCat) ?? CATEGORIES[0];
    }
    if (docOrCat.description && docOrCat.description.includes("[Category:")) {
      const match = docOrCat.description.match(/\[Category:\s*([^\]]+)\]/);
      if (match && match[1]) {
        return {
          value: docOrCat.category,
          labelEn: match[1].trim(),
          icon: FileText,
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
        };
      }
    }
    return CATEGORIES.find((c) => c.value === docOrCat.category) ?? CATEGORIES[0];
  };

  const getFloorName = (floorId: string | null) => {
    if (!floorId) return null;
    return floors.find((f) => f.id === floorId)?.name ?? null;
  };

  const getStageName = (stageId: string | null) => {
    if (!stageId) return null;
    return stages.find((s) => s.id === stageId)?.name ?? null;
  };

  const handleShare = async (doc: DocumentItem) => {
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/api/documents/${doc.id}` : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: doc.title,
          text: doc.description || doc.title,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedDocId(doc.id);
      setTimeout(() => setCopiedDocId(null), 2000);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-200/80 pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">
            Documents
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-1 max-w-xl">
            Store and access blueprints, 3D elevations, structural drawings, MEP layouts, and permits in one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {documents.length === 0 && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                start(async () => {
                  await seedSampleDocuments(projectId);
                  router.refresh();
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 active:scale-95 transition shadow-2xs whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="whitespace-nowrap">{pending ? "Loading..." : "Load Sample Plans"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingDoc(null);
              setIsCustomDocCategory(false);
              setCustomDocCategoryName("");
              setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-clay-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-95 transition whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5] shrink-0" />
            <span className="whitespace-nowrap">Upload Document</span>
          </button>
        </div>
      </div>

      {/* 2. Search, Type Dropdown, Advanced Filters, & View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-paper-200 shadow-2xs">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-paper-200 bg-paper-50/70 py-2.5 pl-10 pr-8 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:bg-white focus:outline-none transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-3 text-ink-400 hover:text-ink-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Controls Group */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Document Type Dropdown */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setDrawerCategory("ALL");
            }}
            className="rounded-xl border border-paper-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-ink-800 focus:border-clay-500 focus:outline-none shadow-2xs"
          >
            <option value="ALL">All Types ({documents.length})</option>
            {allDocCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.labelEn}
              </option>
            ))}
          </select>

          {/* Advanced Filters Drawer Button */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold transition active:scale-95 shadow-2xs",
              activeFiltersCount > 0
                ? "border-clay-400 bg-clay-50 text-clay-900"
                : "border-paper-300 bg-white text-ink-800 hover:bg-paper-50"
            )}
          >
            <SlidersHorizontal className="h-4 w-4 text-ink-500" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-clay-600 px-1.5 py-0.2 text-[10px] font-bold text-white leading-none">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* View Mode Toggle (Grid / List) */}
          <div className="flex items-center rounded-xl border border-paper-200 bg-paper-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-lg p-2 transition",
                viewMode === "grid" ? "bg-white text-ink-900 shadow-2xs font-bold" : "text-ink-500 hover:text-ink-900"
              )}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-lg p-2 transition",
                viewMode === "list" ? "bg-white text-ink-900 shadow-2xs font-bold" : "text-ink-500 hover:text-ink-900"
              )}
              title="List / Register View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Summary Strip */}
      {(selectedType !== "ALL" || drawerCategory !== "ALL" || drawerFloor !== "ALL" || drawerStage !== "ALL" || drawerPinned !== "ALL" || drawerDate !== "ALL" || search) && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-600 bg-paper-100/70 p-2.5 rounded-xl border border-paper-200">
          <span className="font-semibold text-ink-500 pl-1">
            Filtered by:
          </span>
          {(selectedType !== "ALL" || drawerCategory !== "ALL") && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-paper-200 px-2.5 py-1 text-xs font-bold text-ink-800 shadow-2xs">
              Type: {getDocCategoryObj(drawerCategory !== "ALL" ? drawerCategory : selectedType).labelEn}
              <button
                type="button"
                onClick={() => {
                  setSelectedType("ALL");
                  setDrawerCategory("ALL");
                }}
                className="hover:text-red-600 ml-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {drawerFloor !== "ALL" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-paper-200 px-2.5 py-1 text-xs font-bold text-ink-800 shadow-2xs">
              Floor: {getFloorName(drawerFloor)}
              <button type="button" onClick={() => setDrawerFloor("ALL")} className="hover:text-red-600 ml-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {drawerStage !== "ALL" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-paper-200 px-2.5 py-1 text-xs font-bold text-ink-800 shadow-2xs">
              Stage: {getStageName(drawerStage)}
              <button type="button" onClick={() => setDrawerStage("ALL")} className="hover:text-red-600 ml-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {drawerPinned !== "ALL" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-paper-200 px-2.5 py-1 text-xs font-bold text-ink-800 shadow-2xs">
              {drawerPinned === "PINNED" ? "Pinned only" : "Unpinned only"}
              <button type="button" onClick={() => setDrawerPinned("ALL")} className="hover:text-red-600 ml-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-paper-200 px-2.5 py-1 text-xs font-bold text-ink-800 shadow-2xs">
              Search: &quot;{search}&quot;
              <button type="button" onClick={() => setSearch("")} className="hover:text-red-600 ml-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 text-xs font-bold text-clay-700 hover:text-clay-900 underline ml-auto pr-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* 3. Main Content: Grid or List View */}
      {filteredDocs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-paper-300 bg-white p-12 text-center space-y-4 shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-paper-100 text-ink-600 border border-paper-200">
            <Compass className="h-7 w-7 text-clay-700" />
          </div>

          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-display font-bold text-ink-900 text-lg">
              {documents.length === 0 ? "No documents yet" : "No matching documents"}
            </h3>
            <p className="text-xs text-ink-500 leading-relaxed">
              {documents.length === 0
                ? "Upload blueprints, architectural 3D elevations, rebar schedules, or sanction permits."
                : "No files match the currently applied filters. Try adjusting your search query or filters."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {documents.length === 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-clay-700 active:scale-95 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Upload Document</span>
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    start(async () => {
                      await seedSampleDocuments(projectId);
                      router.refresh();
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-paper-50 px-4 py-2.5 text-xs font-bold text-ink-800 hover:bg-paper-100 active:scale-95 transition"
                >
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>{pending ? "Loading..." : "Load Sample Plans"}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-paper-50 px-4 py-2 text-xs font-bold text-ink-800 hover:bg-paper-100 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View: Responsive 1-col (mobile) -> 2-col (tablet) -> 3-col (desktop) */
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => {
            const catObj = getDocCategoryObj(doc);
            const isImage = doc.mimeType.startsWith("image/");
            const isPdf = doc.mimeType === "application/pdf";
            const fileUrl = doc.storagePath.startsWith("/images/") ? doc.storagePath : `/api/documents/${doc.id}`;
            const floorName = getFloorName(doc.floorId);
            const stageName = getStageName(doc.constructionStageId);
            const hasError = previewErrors[doc.id];

            return (
              <div
                key={doc.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-white shadow-xs hover:border-clay-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between",
                  doc.isPinned ? "border-amber-300 ring-1 ring-amber-300/60" : "border-paper-200"
                )}
              >
                <div>
                  {/* Visual Preview / Thumbnail Area */}
                  <div
                    onClick={() => setLightboxDoc(doc)}
                    className="relative h-44 w-full overflow-hidden bg-paper-100 flex items-center justify-center cursor-pointer border-b border-paper-100"
                  >
                    {isImage && !hasError ? (
                      <>
                        <Image
                          src={fileUrl}
                          alt={doc.title}
                          fill
                          loading="lazy"
                          onError={() => setPreviewErrors((prev) => ({ ...prev, [doc.id]: true }))}
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                      </>
                    ) : isPdf && !hasError ? (
                      <div className="flex flex-col items-center justify-center p-5 text-center space-y-2 bg-gradient-to-b from-stone-800 to-stone-900 text-stone-200 w-full h-full">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
                          <FileText className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-bold text-stone-100 line-clamp-1 px-2">{doc.fileName}</p>
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-mono text-stone-300">
                          PDF · {formatFileSize(doc.sizeBytes)}
                        </span>
                      </div>
                    ) : (
                      /* Preview Unavailable Fallback */
                      <div className="flex flex-col items-center justify-center p-4 text-center space-y-1.5 text-ink-500">
                        <AlertCircle className="h-8 w-8 text-ink-400" />
                        <p className="text-xs font-semibold text-ink-600">Preview unavailable</p>
                        <a
                          href={fileUrl}
                          download={doc.fileName}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-clay-700 underline"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download file</span>
                        </a>
                      </div>
                    )}

                    {/* Pin Indicator Badge */}
                    {doc.isPinned && (
                      <div className="absolute top-2.5 left-2.5 rounded-lg bg-amber-500/95 px-2 py-1 text-[10px] font-bold text-white shadow-xs flex items-center gap-1 backdrop-blur-xs">
                        <Pin className="h-3 w-3" />
                        <span>Pinned</span>
                      </div>
                    )}

                    {/* Category Pill Over Image */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className={cn("rounded-lg border px-2 py-0.5 text-[10px] font-bold shadow-2xs backdrop-blur-xs", catObj.badgeColor)}>
                        {catObj.labelEn}
                      </span>
                    </div>

                    {/* Version Badge Bottom Right */}
                    {doc.version && (
                      <div className="absolute bottom-2.5 right-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-mono font-bold text-white backdrop-blur-xs">
                        {doc.version}
                      </div>
                    )}
                  </div>

                  {/* Card Content & Metadata */}
                  <div className="p-4 space-y-2">
                    <h3
                      onClick={() => setLightboxDoc(doc)}
                      className="font-display text-sm font-bold text-ink-900 leading-snug line-clamp-2 hover:text-clay-700 transition cursor-pointer"
                      title={doc.title}
                    >
                      {doc.title}
                    </h3>

                    {/* Date + Optional Stage / Floor */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500">
                      <span>{formatDisplayDate(doc.createdAt)}</span>
                      {(floorName || stageName) && <span>•</span>}
                      {floorName && (
                        <span className="rounded-md bg-paper-100 px-1.5 py-0.5 font-medium text-ink-700">
                          {floorName}
                        </span>
                      )}
                      {stageName && (
                        <span className="rounded-md bg-paper-100 px-1.5 py-0.5 font-medium text-ink-700 truncate max-w-[130px]">
                          {stageName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Action Buttons Strip (Preview, Download, Share, More) */}
                <div className="border-t border-paper-100 p-2.5 bg-paper-50/50 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => setLightboxDoc(doc)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-200/80 transition active:scale-95"
                      title="Preview document"
                    >
                      <Eye className="h-3.5 w-3.5 text-ink-500" />
                      <span>Preview</span>
                    </button>

                    {/* Download Button */}
                    <a
                      href={fileUrl}
                      download={doc.fileName}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-200/80 transition active:scale-95"
                      title="Download document"
                    >
                      <Download className="h-3.5 w-3.5 text-ink-500" />
                      <span>Download</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1 relative">
                    {/* Share Button */}
                    <button
                      type="button"
                      onClick={() => handleShare(doc)}
                      className="rounded-lg p-1.5 text-ink-500 hover:bg-paper-200/80 hover:text-ink-900 transition active:scale-95"
                      title="Share link"
                    >
                      {copiedDocId === doc.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {/* More Options Button */}
                    <button
                      type="button"
                      onClick={() => setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id)}
                      className="rounded-lg p-1.5 text-ink-500 hover:bg-paper-200/80 hover:text-ink-900 transition active:scale-95"
                      title="More actions"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>

                    {/* Popover Menu */}
                    {activeMenuDocId === doc.id && (
                      <div className="absolute bottom-full right-0 mb-1 w-36 rounded-xl border border-paper-200 bg-white py-1 shadow-lg z-20 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuDocId(null);
                            openEditDoc(doc);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left font-semibold text-ink-700 hover:bg-paper-50"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-ink-500" />
                          <span>Edit Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuDocId(null);
                            start(async () => {
                              await togglePinDocument(doc.id);
                              router.refresh();
                            });
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left font-semibold text-ink-700 hover:bg-paper-50"
                        >
                          <Pin className="h-3.5 w-3.5 text-ink-500" />
                          <span>{doc.isPinned ? "Unpin" : "Pin to Top"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuDocId(null);
                            setDocToDelete(doc);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Register View */
        <div className="overflow-x-auto rounded-2xl border border-paper-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs text-ink-700">
            <thead className="border-b border-paper-200 bg-paper-50/70 font-bold uppercase tracking-wider text-ink-500 text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Document Title</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-4">Floor / Stage</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">Uploaded</th>
                <th className="py-3.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {filteredDocs.map((doc) => {
                const catObj = getDocCategoryObj(doc);
                const fileUrl = doc.storagePath.startsWith("/images/") ? doc.storagePath : `/api/documents/${doc.id}`;
                const floorName = getFloorName(doc.floorId);
                const stageName = getStageName(doc.constructionStageId);

                return (
                  <tr key={doc.id} className="hover:bg-paper-50/60 transition group">
                    <td className="py-3.5 px-4 font-bold text-ink-900 max-w-[280px]">
                      <div className="flex items-center gap-2">
                        {doc.isPinned && <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        <button
                          type="button"
                          onClick={() => setLightboxDoc(doc)}
                          className="truncate hover:text-clay-700 transition text-left"
                        >
                          {doc.title}
                        </button>
                      </div>
                      {doc.description && (
                        <p className="text-[11px] font-normal text-ink-400 truncate mt-0.5">{doc.description}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={cn("rounded-lg border px-2 py-0.5 text-[10px] font-bold", catObj.badgeColor)}>
                        {catObj.labelEn}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-ink-600 whitespace-nowrap">
                      {floorName || stageName ? (
                        <span>
                          {floorName}
                          {floorName && stageName ? " • " : ""}
                          {stageName}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-ink-500 whitespace-nowrap">
                      {formatFileSize(doc.sizeBytes)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-ink-500 whitespace-nowrap">
                      {formatDisplayDate(doc.createdAt)}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setLightboxDoc(doc)}
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-paper-100 hover:text-clay-700 transition"
                          title="Preview"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={fileUrl}
                          download={doc.fileName}
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-paper-100 hover:text-clay-700 transition"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleShare(doc)}
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-paper-100 hover:text-clay-700 transition"
                          title="Share link"
                        >
                          {copiedDocId === doc.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditDoc(doc)}
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-paper-100 hover:text-clay-700 transition"
                          title="Edit"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocToDelete(doc)}
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-700 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Advanced Filters Drawer */}
      <Drawer
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Documents"
        subtitle="Refine by document category, floor, stage, or date"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                clearAllFilters();
                setIsFilterDrawerOpen(false);
              }}
            >
              Clear All
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsFilterDrawerOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Document Type */}
          <div>
            <label className="font-bold text-ink-700 block mb-1.5">Document Type</label>
            <select
              value={drawerCategory}
              onChange={(e) => setDrawerCategory(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Floor */}
          {floors.length > 0 && (
            <div>
              <label className="font-bold text-ink-700 block mb-1.5">Floor</label>
              <select
                value={drawerFloor}
                onChange={(e) => setDrawerFloor(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
              >
                <option value="ALL">All Floors</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Construction Stage */}
          {stages.length > 0 && (
            <div>
              <label className="font-bold text-ink-700 block mb-1.5">Construction Stage</label>
              <select
                value={drawerStage}
                onChange={(e) => setDrawerStage(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
              >
                <option value="ALL">All Stages</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pinned Status */}
          <div>
            <label className="font-bold text-ink-700 block mb-1.5">Pinned Status</label>
            <select
              value={drawerPinned}
              onChange={(e) => setDrawerPinned(e.target.value as "ALL" | "PINNED" | "UNPINNED")}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="ALL">All Documents</option>
              <option value="PINNED">Pinned to Top Only</option>
              <option value="UNPINNED">Unpinned Only</option>
            </select>
          </div>

          {/* Upload Date */}
          <div>
            <label className="font-bold text-ink-700 block mb-1.5">Uploaded Date</label>
            <select
              value={drawerDate}
              onChange={(e) => setDrawerDate(e.target.value as "ALL" | "TODAY" | "MONTH" | "LAST_MONTH")}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Uploaded Today</option>
              <option value="MONTH">Uploaded This Month</option>
              <option value="LAST_MONTH">Uploaded Last Month</option>
            </select>
          </div>
        </div>
      </Drawer>

      {/* 5. Upload / Edit Modal */}
      {(showUploadModal || editingDoc) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
          onClick={() => {
            setShowUploadModal(false);
            setEditingDoc(null);
            setUploadError(null);
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-paper-200 bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-paper-100 pb-3">
              <div>
                <h2 id="upload-modal-title" className="font-display text-lg font-bold text-ink-900">
                  {editingDoc ? "Edit Document Details" : "Upload Document / Blueprint"}
                </h2>
                <p className="text-xs text-ink-500 mt-0.5">
                  {editingDoc ? "Update title, category or linked structure" : "Attach high-resolution drawings, plans or permits"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setEditingDoc(null);
                  setUploadError(null);
                }}
                aria-label="Close upload dialog"
                className="rounded-xl p-2 text-ink-400 hover:bg-paper-100 hover:text-ink-900 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {uploadError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
                {uploadError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setUploadError(null);
                const formData = new FormData(e.currentTarget);
                const rawDesc = formData.get("description")?.toString() || "";
                let finalDesc = rawDesc;
                let finalCategory = (formData.get("category")?.toString() || "FLOOR_PLAN") as DocumentItem["category"];

                if (isCustomDocCategory && customDocCategoryName.trim()) {
                  finalCategory = "OTHER";
                  finalDesc = `[Category: ${customDocCategoryName.trim()}] ${rawDesc}`.trim();
                }

                formData.set("category", finalCategory);
                formData.set("description", finalDesc);

                start(async () => {
                  try {
                    if (editingDoc) {
                      const res = await updateDocument(editingDoc.id, {
                        title: formData.get("title")?.toString() ?? editingDoc.title,
                        category: finalCategory,
                        description: finalDesc || null,
                        version: null,
                        floorId: formData.get("floorId")?.toString() || null,
                        constructionStageId: formData.get("constructionStageId")?.toString() || null,
                      });
                      if (res && "error" in res && res.error) {
                        setUploadError(res.error);
                        return;
                      }
                      setEditingDoc(null);
                    } else {
                      const res = await uploadDocument(projectId, formData);
                      if (res && "error" in res && res.error) {
                        setUploadError(res.error);
                        return;
                      }
                      setShowUploadModal(false);
                      setIsCustomDocCategory(false);
                      setCustomDocCategoryName("");
                    }
                    router.refresh();
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : "Failed to save document";
                    if (msg.includes("Server Components render") || msg.includes("digest")) {
                      setUploadError("A server error occurred while processing the document. Please check file format, ensure the server storage directory is writable, and try again.");
                    } else {
                      setUploadError(msg);
                    }
                  }
                });
              }}
              className="space-y-3.5 text-xs"
            >
              {/* Title */}
              <div>
                <label className="font-bold text-ink-700 block mb-1">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  defaultValue={editingDoc?.title ?? ""}
                  placeholder="e.g. Ground Floor Architectural Plan Rev 2"
                  className="w-full rounded-xl border border-paper-300 bg-white p-2.5 font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-ink-700 block">Category</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDocCategory(!isCustomDocCategory);
                      if (isCustomDocCategory) setCustomDocCategoryName("");
                    }}
                    className="text-[11px] font-bold text-clay-700 hover:underline cursor-pointer"
                  >
                    {isCustomDocCategory ? "← Select Standard Category" : "+ Type Custom Category"}
                  </button>
                </div>

                {isCustomDocCategory ? (
                  <div className="space-y-1">
                    <input
                      name="customCategory"
                      type="text"
                      required
                      value={customDocCategoryName}
                      onChange={(e) => setCustomDocCategoryName(e.target.value)}
                      placeholder="e.g. Soil Test Report, Interior 3D, Tax / Khata, Quotation"
                      className="w-full rounded-xl border border-paper-300 bg-white p-2.5 font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none"
                      autoFocus
                    />
                    <p className="text-[10px] text-ink-500">
                      New custom category will be created and tagged to this document.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      name="category"
                      defaultValue={editingDoc?.category ?? "FLOOR_PLAN"}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setIsCustomDocCategory(true);
                        }
                      }}
                      className="w-full appearance-none rounded-xl border border-paper-300 bg-white p-2.5 pr-8 font-medium text-ink-900 focus:border-clay-500 focus:outline-none cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.labelEn}
                        </option>
                      ))}
                      <option value="__custom__">+ Add / Write Custom Category...</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                  </div>
                )}
              </div>

              {/* Floor & Linked Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink-700 block mb-1">Floor (Optional)</label>
                  <select
                    name="floorId"
                    defaultValue={editingDoc?.floorId ?? ""}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
                  >
                    <option value="">None / Entire House</option>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-ink-700 block mb-1">Linked Stage (Optional)</label>
                  <select
                    name="constructionStageId"
                    defaultValue={editingDoc?.constructionStageId ?? ""}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
                  >
                    <option value="">None / General</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Dropzone (Only for new uploads) */}
              {!editingDoc && (
                <div>
                  <label className="font-bold text-ink-700 block mb-1">
                    Select File (PDF / Images / CAD) <span className="text-red-500">*</span>
                  </label>
                  <FileDropzone name="file" required accept="image/*,application/pdf" />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="font-bold text-ink-700 block mb-1">Notes / Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingDoc?.description ?? ""}
                  placeholder="Architect notes, engineer mix specifications, approval sanction no..."
                  className="w-full rounded-xl border border-paper-300 bg-white p-2.5 font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-paper-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setEditingDoc(null);
                  }}
                  className="rounded-xl border border-paper-300 bg-white px-4 py-2 text-xs font-bold text-ink-700 hover:bg-paper-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-clay-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-clay-700 active:scale-95 transition disabled:opacity-50"
                >
                  {pending ? "Saving..." : editingDoc ? "Update Document" : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Preview Lightbox Modal */}
      {lightboxDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-doc-title"
          onClick={() => setLightboxDoc(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-stone-950 border border-stone-800 shadow-2xl flex flex-col justify-between text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-900/90">
              <div className="min-w-0 pr-4">
                <h3 id="lightbox-doc-title" className="font-display text-base font-bold truncate text-white">{lightboxDoc.title}</h3>
                <p className="text-xs text-stone-400 truncate mt-0.5">
                  {lightboxDoc.fileName} · {formatFileSize(lightboxDoc.sizeBytes)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxDoc.storagePath.startsWith("/images/") ? lightboxDoc.storagePath : `/api/documents/${lightboxDoc.id}`}
                  download={lightboxDoc.fileName}
                  className="inline-flex items-center gap-1 rounded-xl bg-stone-800 hover:bg-stone-700 px-3 py-1.5 text-xs font-bold text-white transition min-h-[44px]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxDoc(null)}
                  aria-label="Close document preview"
                  className="rounded-xl bg-stone-800 hover:bg-stone-700 p-2 text-stone-300 hover:text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="relative flex-1 min-h-[360px] max-h-[70vh] overflow-auto bg-stone-950 flex items-center justify-center p-4">
              {lightboxDoc.mimeType.startsWith("image/") ? (
                <div className="relative w-full h-[60vh]">
                  <Image
                    src={lightboxDoc.storagePath.startsWith("/images/") ? lightboxDoc.storagePath : `/api/documents/${lightboxDoc.id}`}
                    alt={lightboxDoc.title}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : lightboxDoc.mimeType === "application/pdf" ? (
                <iframe
                  src={lightboxDoc.storagePath.startsWith("/images/") ? lightboxDoc.storagePath : `/api/documents/${lightboxDoc.id}`}
                  title={lightboxDoc.title}
                  className="w-full h-[60vh] rounded-xl border border-stone-800 bg-white"
                />
              ) : (
                <div className="text-center space-y-3 p-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-stone-400" />
                  <p className="text-sm font-bold text-stone-200">Preview unavailable for this format</p>
                  <p className="text-xs text-stone-400">Please download the file to view it on your device.</p>
                  <a
                    href={lightboxDoc.storagePath.startsWith("/images/") ? lightboxDoc.storagePath : `/api/documents/${lightboxDoc.id}`}
                    download={lightboxDoc.fileName}
                    className="inline-flex items-center gap-2 rounded-xl bg-clay-600 px-4 py-2 text-xs font-bold text-white hover:bg-clay-700"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download File</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!docToDelete}
        onClose={() => {
          if (!isDeletingDoc) setDocToDelete(null);
        }}
        onConfirm={async () => {
          if (!docToDelete || isDeletingDoc) return;
          const target = docToDelete;
          setIsDeletingDoc(true);

          try {
            const res = await deleteDocument(target.id);
            if (res && "error" in res && res.error) {
              alert(res.error);
              setIsDeletingDoc(false);
              return;
            }
            router.refresh();
            setDocToDelete(null);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete document");
          } finally {
            setIsDeletingDoc(false);
          }
        }}
        title="Delete Document?"
        description={`Are you sure you want to permanently delete "${docToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Document"
        variant="danger"
        loading={isDeletingDoc}
      />
    </div>
  );
}
