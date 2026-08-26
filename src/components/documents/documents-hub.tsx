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
    activeBg: "bg-blue-700",
    ring: "ring-blue-700",
  },
  {
    value: "ELEVATION",
    labelEn: "3D Elevations",
    labelTe: "3D ఎలివేషన్లు",
    icon: Sparkles,
    color: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    badge: "bg-emerald-600 text-white",
    activeBg: "bg-emerald-700",
    ring: "ring-emerald-700",
  },
  {
    value: "STRUCTURAL",
    labelEn: "Structural Drawings",
    labelTe: "స్ట్రక్చరల్ డ్రాయింగ్స్",
    icon: Layers,
    color: "bg-amber-50 text-amber-900 border-amber-200/80",
    badge: "bg-amber-600 text-white",
    activeBg: "bg-amber-700",
    ring: "ring-amber-700",
  },
  {
    value: "MEP",
    labelEn: "Electrical & Plumbing",
    labelTe: "ఎలక్ట్రికల్ & ప్లంబింగ్",
    icon: Zap,
    color: "bg-purple-50 text-purple-800 border-purple-200/80",
    badge: "bg-purple-600 text-white",
    activeBg: "bg-purple-700",
    ring: "ring-purple-700",
  },
  {
    value: "APPROVAL",
    labelEn: "Sanctions & Permits",
    labelTe: "ప్రభుత్వ అనుమతులు",
    icon: ShieldCheck,
    color: "bg-rose-50 text-rose-800 border-rose-200/80",
    badge: "bg-rose-600 text-white",
    activeBg: "bg-rose-700",
    ring: "ring-rose-700",
  },
  {
    value: "SITE_PHOTO",
    labelEn: "Site Progress Photos",
    labelTe: "సైట్ ఫోటోలు",
    icon: Camera,
    color: "bg-cyan-50 text-cyan-800 border-cyan-200/80",
    badge: "bg-cyan-600 text-white",
    activeBg: "bg-cyan-800",
    ring: "ring-cyan-800",
  },
  {
    value: "CONTRACT",
    labelEn: "Contracts & Deeds",
    labelTe: "అగ్రిమెంట్లు",
    icon: FileCheck,
    color: "bg-stone-100 text-stone-800 border-stone-300",
    badge: "bg-stone-700 text-white",
    activeBg: "bg-stone-700",
    ring: "ring-stone-700",
  },
  {
    value: "OTHER",
    labelEn: "Other Files",
    labelTe: "ఇతర ఫైళ్ళు",
    icon: FileText,
    color: "bg-gray-50 text-gray-800 border-gray-200",
    badge: "bg-gray-600 text-white",
    activeBg: "bg-gray-700",
    ring: "ring-gray-700",
  },
] as const;

const QUICK_TITLE_SUGGESTIONS = [
  { en: "Ground Floor 2BHK Working Architectural Plan", te: "గ్రౌండ్ ఫ్లోర్ ఆర్కిటెక్చరల్ ప్లాన్", cat: "FLOOR_PLAN" },
  { en: "Front 3D Modern Contemporary Elevation", te: "ముందు వైపు 3D ఆధునిక ఎలివేషన్", cat: "ELEVATION" },
  { en: "Column Footing & Plinth Beam Structural Detail", te: "పిల్లర్ ఫుటింగ్ & ప్లింత్ బీమ్ డ్రాయింగ్", cat: "STRUCTURAL" },
  { en: "Roof Slab Rebar Reinforcement Schedule", te: "రూఫ్ స్లాబ్ స్టీల్ బైండింగ్ డ్రాయింగ్", cat: "STRUCTURAL" },
  { en: "Electrical Point Marking & DB Circuits Plan", te: "ఎలక్ట్రికల్ పాయింట్ మార్కింగ్ ప్లాన్", cat: "MEP" },
  { en: "Municipal / BBMP Building Sanction Permit", te: "మున్సిపల్ బిల్డింగ్ పర్మిట్ ఆర్డర్", cat: "APPROVAL" },
];

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

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedFloor, setSelectedFloor] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightboxDoc, setLightboxDoc] = useState<DocumentItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .filter((doc) => {
        if (activeTab !== "ALL" && doc.category !== activeTab) return false;
        if (selectedFloor !== "ALL" && doc.floorId !== selectedFloor) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          (doc.description && doc.description.toLowerCase().includes(q)) ||
          (doc.version && doc.version.toLowerCase().includes(q)) ||
          doc.fileName.toLowerCase().includes(q)
        );
      });
  }, [documents, activeTab, selectedFloor, search]);

  const pinnedDocs = useMemo(() => {
    return documents.filter((d) => d.isPinned);
  }, [documents]);

  const countForCategory = (cat: string) => {
    return documents.filter((d) => d.category === cat).length;
  };

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
      {/* 1. Sleek Architectural Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-stone-900 text-white shadow-xl border border-stone-800">
        {/* Subtle architectural grid pattern background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-800/80 px-3 py-1 text-xs font-semibold text-clay-300 backdrop-blur-sm">
              <Compass className="h-3.5 w-3.5 text-clay-400" />
              <span>{projectName || "House Construction"} • {language === "te" ? "బ్లూప్రింట్లు & ప్లాన్లు" : "Architectural Repository"}</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-100">
              {t.documents.title}
            </h1>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              {t.documents.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-200 hover:bg-amber-500/20 active:scale-98 transition shadow-xs"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>{pending ? "Loading Samples…" : "Load Sample Blueprints"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingDoc(null);
                setShowUploadModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-clay-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-clay-500 active:scale-98 transition"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>{language === "te" ? "ప్లాన్ అప్‌లోడ్ చేయండి" : "Upload Blueprint / Plan"}</span>
            </button>
          </div>
        </div>

        {/* 2. Top Stats Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-stone-800 bg-stone-950/60 backdrop-blur-sm divide-x divide-stone-800 text-xs">
          <div className="p-3.5 sm:px-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              {language === "te" ? "మొత్తం ఫైళ్ళు" : "Total Blueprints"}
            </span>
            <span className="font-serif text-lg font-bold text-stone-100 mt-0.5 block">
              {documents.length}
            </span>
          </div>

          <div className="p-3.5 sm:px-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              {language === "te" ? "ఫ్లోర్ ప్లాన్లు & 3D" : "Floor Plans & 3D"}
            </span>
            <span className="font-serif text-lg font-bold text-stone-100 mt-0.5 block">
              {countForCategory("FLOOR_PLAN") + countForCategory("ELEVATION")}
            </span>
          </div>

          <div className="p-3.5 sm:px-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              {language === "te" ? "స్ట్రక్చరల్ & MEP" : "Structural & MEP"}
            </span>
            <span className="font-serif text-lg font-bold text-stone-100 mt-0.5 block">
              {countForCategory("STRUCTURAL") + countForCategory("MEP")}
            </span>
          </div>

          <div className="p-3.5 sm:px-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              {language === "te" ? "అనుమతులు & అగ్రిమెంట్" : "Permits & Sanctions"}
            </span>
            <span className="font-serif text-lg font-bold text-stone-100 mt-0.5 block">
              {countForCategory("APPROVAL") + countForCategory("CONTRACT")}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Navigation & Search Controls */}
      <div className="space-y-3">
        {/* Category Pills Navigation (Responsive Wrap + Clean Scrollbar-free) */}
        <div className="rounded-2xl bg-white p-2 border border-paper-200/90 shadow-2xs">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs shrink-0 active:scale-98",
                activeTab === "ALL"
                  ? "bg-stone-900 text-white shadow-sm ring-1 ring-stone-900"
                  : "bg-paper-50/80 text-stone-700 hover:bg-paper-100 hover:text-stone-900 border border-paper-200/80"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{t.documents.tabAll}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                  activeTab === "ALL" ? "bg-stone-700 text-stone-100" : "bg-paper-200 text-stone-600"
                )}
              >
                {documents.length}
              </span>
            </button>

            {CATEGORIES.map((cat) => {
              const count = countForCategory(cat.value);
              const label = language === "te" ? cat.labelTe : cat.labelEn;
              const Icon = cat.icon;
              const isSelected = activeTab === cat.value;

              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setActiveTab(cat.value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs shrink-0 active:scale-98",
                    isSelected
                      ? cn(cat.activeBg, "text-white shadow-sm ring-1", cat.ring)
                      : "bg-paper-50/80 text-stone-700 hover:bg-paper-100 hover:text-stone-900 border border-paper-200/80"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      isSelected ? "text-white" : "text-stone-500"
                    )}
                  />
                  <span>{label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                      isSelected
                        ? "bg-black/25 text-white"
                        : "bg-paper-200 text-stone-600"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Floor Filter, & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-paper-200 shadow-2xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder={
                language === "te"
                  ? "ప్లాన్ పేరు లేదా రివిజన్ ద్వారా వెతకండి..."
                  : "Search plans, drawings, revisions, notes..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-paper-200 bg-paper-50/70 py-2 pl-10 pr-4 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:border-clay-500 focus:bg-white focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Floor filter dropdown */}
            {floors.length > 0 && (
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="rounded-xl border border-paper-200 bg-paper-50 px-3 py-2 text-xs font-semibold text-stone-800 focus:border-clay-500 focus:outline-none"
              >
                <option value="ALL">All Floors</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}

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

            <span className="text-xs font-semibold text-stone-500 pl-1 hidden md:inline">
              {filteredDocs.length} {language === "te" ? "డ్రాయింగ్లు" : "drawings"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Pinned Hero Strip (if any pinned documents exist) */}
      {pinnedDocs.length > 0 && activeTab === "ALL" && !search && selectedFloor === "ALL" && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
            <Pin className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
            <span>Pinned Sanction Permits & Primary Blueprints</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedDocs.map((doc) => {
              const catObj = getDocCategoryObj(doc.category);
              const isImage = doc.mimeType.startsWith("image/");
              const fileUrl = doc.storagePath.startsWith("/images/") ? doc.storagePath : `/api/documents/${doc.id}`;

              return (
                <div
                  key={doc.id}
                  className="group relative overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-white p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn("rounded-lg border px-2 py-0.5 text-[10px] font-bold", catObj.color)}>
                        {language === "te" ? catObj.labelTe : catObj.labelEn}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/90 rounded-md px-2 py-0.5">
                        <Pin className="h-3 w-3 fill-amber-500 text-amber-700" />
                        <span>Pinned</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center">
                        {isImage ? (
                          <Image src={fileUrl} alt={doc.title} fill className="object-cover" />
                        ) : (
                          <FileText className="h-7 w-7 text-red-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-serif font-bold text-sm text-stone-900 truncate group-hover:text-clay-700 transition">
                          {doc.title}
                        </h4>
                        {doc.version && (
                          <span className="text-[10px] font-bold text-clay-700 block">
                            {doc.version}
                          </span>
                        )}
                        <span className="text-[11px] text-stone-400 font-medium block">
                          {formatFileSize(doc.sizeBytes)} • {new Date(doc.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-paper-100 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (isImage) setLightboxDoc(doc);
                        else window.open(fileUrl, "_blank");
                      }}
                      className="inline-flex items-center gap-1 font-bold text-clay-700 hover:text-clay-900 transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{t.documents.viewFull}</span>
                    </button>

                    <a
                      href={fileUrl}
                      download={doc.fileName}
                      className="inline-flex items-center gap-1 font-bold text-stone-600 hover:text-stone-900 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{t.documents.download}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Documents Content (Grid or Table) */}
      {filteredDocs.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-paper-300 bg-white p-10 sm:p-14 text-center space-y-5 shadow-2xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-stone-100 text-stone-700 border border-stone-200 shadow-inner">
            <Compass className="h-8 w-8 text-clay-700" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-serif font-bold text-stone-900 text-lg sm:text-xl">
              {t.documents.noDocsFound}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              {t.documents.noDocsSub}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-clay-600 px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-clay-700 active:scale-98 transition"
            >
              <Plus className="h-4 w-4" />
              <span>{language === "te" ? "ప్లాన్ అప్‌లోడ్ చేయండి" : "Upload Blueprint / Plan"}</span>
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
              className="inline-flex items-center gap-2 rounded-2xl border border-paper-300 bg-paper-50 px-5 py-3 text-xs font-bold text-stone-800 hover:bg-paper-100 active:scale-98 transition"
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>{pending ? "Loading Samples…" : "Load Sample Architectural Drawings"}</span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
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
                  <div className="relative h-48 w-full overflow-hidden bg-stone-900 flex items-center justify-center">
                    {isImage ? (
                      <>
                        <Image
                          src={fileUrl}
                          alt={doc.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-black/20 to-stone-950/40" />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 bg-gradient-to-b from-stone-800 to-stone-900 text-stone-200 w-full h-full">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
                          <FileText className="h-6 w-6" />
                        </div>
                        <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300 uppercase tracking-wider">
                          PDF Document
                        </span>
                        <p className="text-[11px] font-medium text-stone-400 max-w-[200px] truncate">
                          {doc.fileName}
                        </p>
                      </div>
                    )}

                    {/* Top Badges (Category & Pin Toggle) */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                      <span className={cn("rounded-xl border px-2.5 py-1 text-[11px] font-bold shadow-xs backdrop-blur-md", catObj.color)}>
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
                        title={doc.isPinned ? t.documents.unpin : t.documents.pin}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Lightbox / View Fullscreen Overlay Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isImage) {
                          setLightboxDoc(doc);
                        } else {
                          window.open(fileUrl, "_blank");
                        }
                      }}
                      className="absolute bottom-3 right-3 rounded-xl bg-white/90 px-2.5 py-1.5 text-xs font-bold text-stone-900 shadow-md backdrop-blur-md hover:bg-white transition active:scale-95 flex items-center gap-1"
                      title={t.documents.viewFull}
                    >
                      <Eye className="h-3.5 w-3.5 text-clay-700" />
                      <span>Preview</span>
                    </button>
                  </div>

                  {/* Document Card Details */}
                  <div className="p-4 space-y-2.5">
                    <div>
                      <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-clay-800 transition">
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
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-stone-600">
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
                      <span>{t.documents.download}</span>
                    </a>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`House Blueprint: ${doc.title} (${doc.version ?? "Latest"})\n${typeof window !== "undefined" ? window.location.origin : ""}${fileUrl}`)}`}
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
                      title={t.documents.edit}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t.documents.confirmDelete)) {
                          start(async () => {
                            await deleteDocument(doc.id);
                            router.refresh();
                          });
                        }
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title={t.documents.delete}
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
        /* Table / Register View */
        <div className="rounded-3xl border border-paper-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper-50 text-stone-600 font-bold uppercase tracking-wider border-b border-paper-200">
                <tr>
                  <th className="px-4 py-3">Blueprint / Title</th>
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
                            onClick={() => {
                              if (confirm(t.documents.confirmDelete)) {
                                start(async () => {
                                  await deleteDocument(doc.id);
                                  router.refresh();
                                });
                              }
                            }}
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

      {/* 6. Upload Blueprint Modal */}
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
                    {t.documents.uploadModalTitle}
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
                  {t.documents.docCategory} <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  required
                  defaultValue="FLOOR_PLAN"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3.5 py-2.5 text-xs font-bold text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {language === "te" ? cat.labelTe : cat.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title Input & Quick Suggestions */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {t.documents.docTitle} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder={t.documents.docTitlePlaceholder}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3.5 py-2 text-xs font-medium text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />

                {/* Quick suggestions pills */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {QUICK_TITLE_SUGGESTIONS.slice(0, 4).map((sugg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.closest("div")?.previousElementSibling as HTMLInputElement;
                        if (input) input.value = language === "te" ? sugg.te : sugg.en;
                      }}
                      className="rounded-md bg-paper-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 hover:bg-clay-50 hover:text-clay-700 transition"
                    >
                      + {language === "te" ? sugg.te.split(" ")[0] : sugg.en.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag & Drop File Upload Zone */}
              <FileDropzone
                name="file"
                required
                label={t.documents.chooseFile}
                accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
                helperText={
                  language === "te"
                    ? "ఫోటోలు (JPG, PNG, WebP) లేదా PDF ప్లాన్లు / బ్లూప్రింట్లు (గరిష్టంగా 20 MB)"
                    : "Supports High-Res Images (JPG, PNG, WebP) or PDF Blueprints (Up to 20 MB)"
                }
              />

              {/* Version & Floor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {t.documents.version}
                  </label>
                  <input
                    type="text"
                    name="version"
                    placeholder={t.documents.versionPlaceholder}
                    className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === "te" ? "అంతస్తు (Floor)" : "Floor Link (Optional)"}
                  </label>
                  <select
                    name="floorId"
                    className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">{language === "te" ? "-- అంతస్తు ఎంచుకోండి --" : "-- Any / Entire House --"}</option>
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
                  {t.documents.description}
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder={t.documents.descriptionPlaceholder}
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
                  📌 {t.documents.pinned}
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
                  {pending ? t.documents.saving : t.documents.saveDoc}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Edit Document Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative max-w-lg w-full rounded-3xl bg-white shadow-2xl p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-paper-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-clay-700" />
                <h3 className="font-serif font-bold text-stone-900 text-lg">
                  Edit Drawing Details
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
                  Drawing Title <span className="text-red-500">*</span>
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
                  {pending ? "Saving..." : "Update Blueprint"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Fullscreen Image Lightbox Modal */}
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
                  <span>{t.documents.download}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

