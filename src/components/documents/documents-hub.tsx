"use client";

import { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/language-context";
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
    labelEn: "Floor Plans",
    labelTe: "ఫ్లోర్ ప్లాన్లు",
    icon: Compass,
    color: "bg-blue-50 text-blue-800 border-blue-200/80",
    badge: "bg-blue-600 text-white",
  },
  {
    value: "ELEVATION",
    labelEn: "3D Elevations",
    labelTe: "3D ఎలివేషన్లు",
    icon: Sparkles,
    color: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    badge: "bg-emerald-600 text-white",
  },
  {
    value: "STRUCTURAL",
    labelEn: "Structural Drawings",
    labelTe: "స్ట్రక్చరల్ డ్రాయింగ్స్",
    icon: Layers,
    color: "bg-amber-50 text-amber-900 border-amber-200/80",
    badge: "bg-amber-600 text-white",
  },
  {
    value: "MEP",
    labelEn: "Electrical & Plumbing",
    labelTe: "ఎలక్ట్రికల్ & ప్లంబింగ్",
    icon: Zap,
    color: "bg-purple-50 text-purple-800 border-purple-200/80",
    badge: "bg-purple-600 text-white",
  },
  {
    value: "APPROVAL",
    labelEn: "Sanctions & Permits",
    labelTe: "ప్రభుత్వ అనుమతులు",
    icon: ShieldCheck,
    color: "bg-rose-50 text-rose-800 border-rose-200/80",
    badge: "bg-rose-600 text-white",
  },
  {
    value: "SITE_PHOTO",
    labelEn: "Site Progress Photos",
    labelTe: "సైట్ ఫోటోలు",
    icon: Camera,
    color: "bg-cyan-50 text-cyan-800 border-cyan-200/80",
    badge: "bg-cyan-600 text-white",
  },
  {
    value: "CONTRACT",
    labelEn: "Contracts & Deeds",
    labelTe: "అగ్రిమెంట్లు",
    icon: FileCheck,
    color: "bg-stone-100 text-stone-800 border-stone-300",
    badge: "bg-stone-700 text-white",
  },
  {
    value: "OTHER",
    labelEn: "Other Files",
    labelTe: "ఇతర ఫైళ్ళు",
    icon: FileText,
    color: "bg-gray-50 text-gray-800 border-gray-200",
    badge: "bg-gray-600 text-white",
  },
] as const;

export function DocumentsHub({
  projectId,
  projectName,
  documents = [],
  floors = [],
  stages = [],
}: {
  projectId: string;
  projectName: string;
  documents?: DocumentItem[];
  floors?: { id: string; name: string }[];
  stages?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [pending, start] = useTransition();

  // Primary Controls
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Advanced Filter Drawer State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<string>("ALL");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [onlyPinned, setOnlyPinned] = useState(false);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightboxDoc, setLightboxDoc] = useState<DocumentItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);

  // Active advanced filters count
  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (selectedFloor !== "ALL") count++;
    if (selectedStage !== "ALL") count++;
    if (onlyPinned) count++;
    return count;
  }, [selectedFloor, selectedStage, onlyPinned]);

  const clearAllFilters = () => {
    setSearch("");
    setSelectedType("ALL");
    setSelectedFloor("ALL");
    setSelectedStage("ALL");
    setOnlyPinned(false);
  };

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .filter((doc) => {
        if (selectedType !== "ALL" && doc.category !== selectedType) return false;
        if (selectedFloor !== "ALL" && doc.floorId !== selectedFloor) return false;
        if (selectedStage !== "ALL" && doc.constructionStageId !== selectedStage) return false;
        if (onlyPinned && !doc.isPinned) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          (doc.description && doc.description.toLowerCase().includes(q)) ||
          (doc.version && doc.version.toLowerCase().includes(q)) ||
          doc.fileName.toLowerCase().includes(q)
        );
      });
  }, [documents, selectedType, selectedFloor, selectedStage, onlyPinned, search]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocCategoryObj = (cat: string) => {
    return CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[0];
  };

  const getFloorName = (floorId: string | null) => {
    if (!floorId) return null;
    return floors.find((f) => f.id === floorId)?.name ?? null;
  };

  const getStageName = (stageId: string | null) => {
    if (!stageId) return null;
    return stages.find((s) => s.id === stageId)?.name ?? null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-200/80 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-paper-300 bg-paper-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700">
            <Compass className="h-3 w-3 text-clay-700" />
            <span>{projectName || "House Project"}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            {t.documents.title}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-xl leading-relaxed">
            Store plans, drawings, bills, site photos and construction documents.
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 active:scale-98 transition shadow-2xs"
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>{pending ? "Loading..." : "Load Sample Plans"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingDoc(null);
              setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-98 transition"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* 2. Search, Type Dropdown, Advanced Filters, & View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-paper-200 shadow-2xs">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder={
              language === "te"
                ? "ప్లాన్లు, డ్రాయింగ్లు, రివిజన్ ద్వారా వెతకండి..."
                : "Search documents, drawings, revisions..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-paper-200 bg-paper-50/70 py-2 pl-10 pr-4 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:border-clay-500 focus:bg-white focus:outline-none transition"
          />
        </div>

        {/* Controls Group */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Document Type Dropdown */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-paper-200 bg-paper-50 px-3 py-2 text-xs font-bold text-stone-800 focus:border-clay-500 focus:outline-none"
          >
            <option value="ALL">All Types ({documents.length})</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {language === "te" ? cat.labelTe : cat.labelEn}
              </option>
            ))}
          </select>

          {/* Advanced Filters Drawer Button */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95",
              activeAdvancedFilterCount > 0
                ? "border-clay-400 bg-clay-50 text-clay-800"
                : "border-paper-200 bg-paper-50 text-stone-700 hover:bg-paper-100"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeAdvancedFilterCount > 0 && (
              <span className="rounded-full bg-clay-600 px-1.5 py-0.2 text-[10px] font-bold text-white leading-none">
                {activeAdvancedFilterCount}
              </span>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-paper-200 bg-paper-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-lg p-1.5 transition",
                viewMode === "grid" ? "bg-white text-stone-900 shadow-2xs font-bold" : "text-stone-500 hover:text-stone-900"
              )}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "rounded-lg p-1.5 transition",
                viewMode === "table" ? "bg-white text-stone-900 shadow-2xs font-bold" : "text-stone-500 hover:text-stone-900"
              )}
              title="List / Register View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Summary Strip */}
      {(selectedType !== "ALL" || selectedFloor !== "ALL" || selectedStage !== "ALL" || onlyPinned || search) && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600 bg-paper-100/70 p-2 rounded-xl border border-paper-200">
          <span className="font-semibold text-stone-500 pl-1">Filtered by:</span>
          {selectedType !== "ALL" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white border border-paper-200 px-2 py-0.5 text-[11px] font-bold text-stone-800">
              Type: {getDocCategoryObj(selectedType).labelEn}
              <button type="button" onClick={() => setSelectedType("ALL")} className="hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedFloor !== "ALL" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white border border-paper-200 px-2 py-0.5 text-[11px] font-bold text-stone-800">
              Floor: {getFloorName(selectedFloor)}
              <button type="button" onClick={() => setSelectedFloor("ALL")} className="hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedStage !== "ALL" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white border border-paper-200 px-2 py-0.5 text-[11px] font-bold text-stone-800">
              Stage: {getStageName(selectedStage)}
              <button type="button" onClick={() => setSelectedStage("ALL")} className="hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {onlyPinned && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white border border-paper-200 px-2 py-0.5 text-[11px] font-bold text-stone-800">
              Pinned only
              <button type="button" onClick={() => setOnlyPinned(false)} className="hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white border border-paper-200 px-2 py-0.5 text-[11px] font-bold text-stone-800">
              Search: &quot;{search}&quot;
              <button type="button" onClick={() => setSearch("")} className="hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-clay-700 hover:text-clay-900 underline ml-auto pr-1"
          >
            <RotateCcw className="h-3 w-3" />
            Clear all
          </button>
        </div>
      )}

      {/* 3. Main Content: Grid or Table View */}
      {filteredDocs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-paper-300 bg-white p-12 text-center space-y-4 shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-600 border border-stone-200">
            <Compass className="h-7 w-7 text-clay-700" />
          </div>

          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              {documents.length === 0 ? "No documents yet" : "No matching documents"}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-clay-700 active:scale-98 transition"
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-paper-50 px-4 py-2.5 text-xs font-bold text-stone-800 hover:bg-paper-100 active:scale-98 transition"
                >
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>{pending ? "Loading..." : "Load Sample Plans"}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-paper-50 px-4 py-2 text-xs font-bold text-stone-800 hover:bg-paper-100 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Cards */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => {
            const catObj = getDocCategoryObj(doc.category);
            const isImage = doc.mimeType.startsWith("image/");
            const isPdf = doc.mimeType === "application/pdf";
            const fileUrl = doc.storagePath.startsWith("/images/") ? doc.storagePath : `/api/documents/${doc.id}`;
            const floorName = getFloorName(doc.floorId);
            const stageName = getStageName(doc.constructionStageId);

            return (
              <div
                key={doc.id}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border bg-white shadow-2xs hover:border-clay-300 hover:shadow-md transition flex flex-col justify-between",
                  doc.isPinned ? "border-amber-300 ring-1 ring-amber-300/60" : "border-paper-200"
                )}
              >
                <div>
                  {/* Visual Preview / Thumbnail Area */}
                  <div className="relative h-44 w-full overflow-hidden bg-stone-900 flex items-center justify-center">
                    {isImage ? (
                      <>
                        <Image
                          src={fileUrl}
                          alt={doc.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-black/10 to-stone-950/30" />
                      </>
                    ) : isPdf ? (
                      <div className="flex flex-col items-center justify-center p-5 text-center space-y-1.5 bg-gradient-to-b from-stone-800 to-stone-900 text-stone-200 w-full h-full">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300 uppercase tracking-wider">
                          PDF Document
                        </span>
                        <p className="text-[11px] font-medium text-stone-400 max-w-[200px] truncate">
                          {doc.fileName}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-5 text-center space-y-1.5 bg-gradient-to-b from-stone-800 to-stone-900 text-stone-200 w-full h-full">
                        <FileText className="h-7 w-7 text-stone-400" />
                        <span className="text-[11px] text-stone-400 font-medium truncate max-w-[180px]">
                          {doc.fileName}
                        </span>
                      </div>
                    )}

                    {/* Top Badges (Category & Pin Toggle) */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                      <span className={cn("rounded-xl border px-2.5 py-0.5 text-[10px] font-bold shadow-xs backdrop-blur-md", catObj.color)}>
                        {language === "te" ? catObj.labelTe : catObj.labelEn}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          start(async () => {
                            await togglePinDocument(doc.id);
                            router.refresh();
                          });
                        }}
                        className={cn(
                          "rounded-full p-1.5 transition active:scale-95 shadow-xs backdrop-blur-md",
                          doc.isPinned
                            ? "bg-amber-400 text-stone-950 font-bold shadow-sm"
                            : "bg-white/85 text-stone-700 hover:bg-white"
                        )}
                        title={doc.isPinned ? "Unpin document" : "Pin to top"}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Preview Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isImage) setLightboxDoc(doc);
                        else window.open(fileUrl, "_blank");
                      }}
                      className="absolute bottom-3 right-3 rounded-xl bg-white/90 px-2.5 py-1.5 text-xs font-bold text-stone-900 shadow-md backdrop-blur-md hover:bg-white transition active:scale-95 flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5 text-clay-700" />
                      <span>Preview</span>
                    </button>
                  </div>

                  {/* Document Card Details */}
                  <div className="p-4 space-y-2">
                    <div>
                      <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-clay-800 transition line-clamp-1">
                        {doc.title}
                      </h3>
                      {doc.version && (
                        <span className="inline-block mt-1 rounded-md bg-stone-100 border border-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-800">
                          🏷️ {doc.version}
                        </span>
                      )}
                    </div>

                    {doc.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>
                    )}

                    {/* Floor / Stage Tag */}
                    {(floorName || stageName) && (
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-stone-600 pt-0.5">
                        {floorName && (
                          <span className="rounded-md bg-paper-100 px-2 py-0.5 border border-paper-200">
                            🏢 {floorName}
                          </span>
                        )}
                        {stageName && (
                          <span className="rounded-md bg-paper-100 px-2 py-0.5 border border-paper-200">
                            🏗️ {stageName}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between text-[11px] text-stone-400 font-medium border-t border-paper-100">
                      <span>{formatFileSize(doc.sizeBytes)}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-0 border-t border-paper-100 mt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={fileUrl}
                      download={doc.fileName}
                      className="inline-flex items-center gap-1 font-bold text-clay-700 hover:text-clay-900 transition bg-clay-50 hover:bg-clay-100 rounded-xl px-2.5 py-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Construction Document: ${doc.title} (${doc.version ?? "Latest"})\n${typeof window !== "undefined" ? window.location.origin : ""}${fileUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#25D366] hover:bg-emerald-50 rounded-xl px-2 py-1.5 transition"
                      title="Share blueprint link on WhatsApp"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingDoc(doc)}
                      className="p-1.5 text-stone-500 hover:bg-paper-100 hover:text-stone-900 rounded-lg transition"
                      title="Edit details"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-3xl border border-paper-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper-50 text-stone-600 font-bold uppercase tracking-wider border-b border-paper-200">
                <tr>
                  <th className="px-4 py-3">Document / Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Revision</th>
                  <th className="px-4 py-3">Floor / Stage</th>
                  <th className="px-4 py-3">Size & Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100 font-medium">
                {filteredDocs.map((doc) => {
                  const catObj = getDocCategoryObj(doc.category);
                  const isImage = doc.mimeType.startsWith("image/");
                  const fileUrl = doc.storagePath.startsWith("/images/") ? doc.storagePath : `/api/documents/${doc.id}`;
                  const floorName = getFloorName(doc.floorId);

                  return (
                    <tr key={doc.id} className="hover:bg-paper-50/60 transition">
                      <td className="px-4 py-3 font-bold text-stone-900">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              start(async () => {
                                await togglePinDocument(doc.id);
                                router.refresh();
                              });
                            }}
                            className={cn(
                              "p-1 rounded-md transition",
                              doc.isPinned ? "text-amber-500 bg-amber-50" : "text-stone-300 hover:text-stone-600"
                            )}
                            title={doc.isPinned ? "Unpin" : "Pin"}
                          >
                            <Pin className="h-3.5 w-3.5" />
                          </button>

                          <div className="min-w-0">
                            <span className="block truncate max-w-xs">{doc.title}</span>
                            <span className="text-[10px] text-stone-400 font-normal">{doc.fileName}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold", catObj.color)}>
                          {language === "te" ? catObj.labelTe : catObj.labelEn}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {doc.version ? (
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                            {doc.version}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-stone-600">
                        {floorName ?? <span className="text-stone-300">—</span>}
                      </td>

                      <td className="px-4 py-3 text-stone-500 text-[11px]">
                        <div>{formatFileSize(doc.sizeBytes)}</div>
                        <div className="text-stone-400">
                          {new Date(doc.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (isImage) setLightboxDoc(doc);
                              else window.open(fileUrl, "_blank");
                            }}
                            className="p-1.5 text-stone-600 hover:bg-paper-100 rounded-lg transition"
                            title="Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          <a
                            href={fileUrl}
                            download={doc.fileName}
                            className="p-1.5 text-clay-700 hover:bg-clay-50 rounded-lg transition"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => setEditingDoc(doc)}
                            className="p-1.5 text-stone-500 hover:bg-paper-100 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDocToDelete(doc)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
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
        </div>
      )}

      {/* 4. Advanced Filter Drawer */}
      <Drawer
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Documents"
        subtitle="Refine documents by specific criteria"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={clearAllFilters}
              className="text-xs"
            >
              Clear all
            </Button>
            <Button
              type="button"
              onClick={() => setIsFilterDrawerOpen(false)}
              className="bg-clay-600 hover:bg-clay-700 text-white text-xs font-bold px-5"
            >
              Apply ({filteredDocs.length} results)
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Document Type */}
          <div>
            <label className="block font-bold text-stone-800 mb-1.5">Document Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Types</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Floor */}
          <div>
            <label className="block font-bold text-stone-800 mb-1.5">Floor Level</label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Floors / Unassigned</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Construction Stage */}
          <div>
            <label className="block font-bold text-stone-800 mb-1.5">Construction Stage</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Stages / General</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pinned filter toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-paper-200 bg-paper-50/60 cursor-pointer hover:bg-paper-100/60 transition">
              <input
                type="checkbox"
                checked={onlyPinned}
                onChange={(e) => setOnlyPinned(e.target.checked)}
                className="h-4 w-4 rounded text-clay-600 focus:ring-clay-500 border-paper-300"
              />
              <span className="font-bold text-stone-800">📌 Show Pinned Only</span>
            </label>
          </div>
        </div>
      </Drawer>

      {/* 5. Upload Blueprint / Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative max-w-xl w-full rounded-3xl bg-white shadow-2xl p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-paper-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-100 text-clay-700">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-lg">
                    Upload Document / Plan
                  </h3>
                  <p className="text-xs text-stone-500">Attach CAD drawings, 3D elevation renders, or sanctioned permits</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-paper-100 hover:text-stone-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setUploadError(null);
                const formElement = e.currentTarget;
                const formData = new FormData(formElement);
                start(async () => {
                  const res = await uploadDocument(projectId, formData);
                  if (res?.error) {
                    setUploadError(res.error);
                    return;
                  }
                  setShowUploadModal(false);
                  router.refresh();
                });
              }}
            >
              {uploadError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
                  {uploadError}
                </div>
              )}

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  required
                  defaultValue="FLOOR_PLAN"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3.5 py-2.5 text-xs font-bold text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Ground Floor Working Plan"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3.5 py-2 text-xs font-medium text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Drag & Drop File Upload Zone */}
              <FileDropzone
                name="file"
                required
                label="Choose File"
                accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
                helperText="Supports Images (JPG, PNG, WEBP) or PDF Blueprints (Up to 20 MB)"
              />

              {/* Version & Floor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Revision Tag
                  </label>
                  <input
                    type="text"
                    name="version"
                    placeholder="e.g. v2.1 Approved"
                    className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Floor Link (Optional)
                  </label>
                  <select
                    name="floorId"
                    className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Any / Entire House --</option>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Description / Notes
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Additional architectural notes..."
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Pin checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPinnedCheck"
                  name="isPinned"
                  value="true"
                  className="h-4 w-4 rounded text-clay-600 focus:ring-clay-500 border-paper-300"
                />
                <label htmlFor="isPinnedCheck" className="text-xs font-bold text-stone-800 cursor-pointer">
                  📌 Pin to Top Showcase
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-paper-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowUploadModal(false)}
                  className="w-1/3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-clay-600 hover:bg-clay-700 font-bold text-white text-xs py-2.5 rounded-xl shadow-sm"
                >
                  {pending ? "Saving..." : "Save Document"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Document Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative max-w-lg w-full rounded-3xl bg-white shadow-2xl p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-paper-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-clay-700" />
                <h3 className="font-serif font-bold text-stone-900 text-lg">
                  Edit Document Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-paper-100 hover:text-stone-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                start(async () => {
                  await updateDocument(editingDoc.id, {
                    title: String(form.get("title") ?? ""),
                    category: form.get("category") as DocumentItem["category"],
                    version: String(form.get("version") ?? ""),
                    floorId: form.get("floorId") ? String(form.get("floorId")) : null,
                    description: form.get("description") ? String(form.get("description")) : null,
                    isPinned: form.get("isPinned") === "true",
                  });
                  setEditingDoc(null);
                  router.refresh();
                });
              }}
            >
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingDoc.title}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3.5 py-2 text-xs font-medium text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={editingDoc.category}
                    className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-semibold text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Revision Tag
                  </label>
                  <input
                    type="text"
                    name="version"
                    defaultValue={editingDoc.version ?? ""}
                    className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Floor
                </label>
                <select
                  name="floorId"
                  defaultValue={editingDoc.floorId ?? ""}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                >
                  <option value="">-- Any / Entire House --</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Description / Notes
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingDoc.description ?? ""}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editPinnedCheck"
                  name="isPinned"
                  value="true"
                  defaultChecked={editingDoc.isPinned}
                  className="h-4 w-4 rounded text-clay-600 focus:ring-clay-500 border-paper-300"
                />
                <label htmlFor="editPinnedCheck" className="text-xs font-bold text-stone-800 cursor-pointer">
                  📌 Pin to Top Showcase
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-paper-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingDoc(null)}
                  className="w-1/3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-clay-600 hover:bg-clay-700 font-bold text-white text-xs py-2.5 rounded-xl shadow-sm"
                >
                  {pending ? "Saving..." : "Update Details"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Fullscreen Image Lightbox Modal */}
      {lightboxDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 sm:p-6 backdrop-blur-md">
          <div className="relative max-w-5xl w-full h-full max-h-[92vh] overflow-hidden rounded-3xl bg-stone-950 border border-stone-800 shadow-2xl flex flex-col justify-between p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between text-white border-b border-stone-800 pb-3">
              <div>
                <span className="text-xs font-bold text-clay-400">
                  {getDocCategoryObj(lightboxDoc.category).labelEn}
                </span>
                <h3 className="font-serif font-bold text-base sm:text-xl text-stone-100">
                  {lightboxDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxDoc(null)}
                className="rounded-full p-2 text-stone-400 hover:bg-stone-800 hover:text-white transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="relative flex-1 w-full my-3 overflow-hidden rounded-2xl bg-black flex items-center justify-center">
              <Image
                src={lightboxDoc.storagePath.startsWith("/images/") ? lightboxDoc.storagePath : `/api/documents/${lightboxDoc.id}`}
                alt={lightboxDoc.title}
                fill
                className="object-contain"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400 border-t border-stone-800 pt-3">
              <p className="font-medium max-w-lg truncate">
                {lightboxDoc.description ?? lightboxDoc.fileName}
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxDoc.storagePath.startsWith("/images/") ? lightboxDoc.storagePath : `/api/documents/${lightboxDoc.id}`}
                  download={lightboxDoc.fileName}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 font-bold text-stone-950 hover:bg-stone-200 transition shadow-xs"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={() => {
          if (!docToDelete) return;
          start(async () => {
            await deleteDocument(docToDelete.id);
            setDocToDelete(null);
            router.refresh();
          });
        }}
        title="Delete Construction Document"
        description={`Are you sure you want to delete "${docToDelete?.title}"? This cannot be undone.`}
        confirmText="Delete Document"
        loading={pending}
      />
    </div>
  );
}
