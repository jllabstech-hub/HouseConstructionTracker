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
} from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { cn } from "@/lib/utils";
import {
  Layers,
  FileText,
  Image as ImageIcon,
  Plus,
  Pin,
  Eye,
  Download,
  Trash2,
  Edit3,
  X,
  Share2,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Calendar,
  Sparkles,
  Search,
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
  { value: "FLOOR_PLAN", labelEn: "Floor Plans", labelTe: "ఫ్లోర్ ప్లాన్లు", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { value: "ELEVATION", labelEn: "3D Elevations", labelTe: "3D ఎలివేషన్లు", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { value: "STRUCTURAL", labelEn: "Structural Drawings", labelTe: "స్ట్రక్చరల్ డ్రాయింగ్స్", color: "bg-amber-50 text-amber-900 border-amber-200" },
  { value: "MEP", labelEn: "Electrical & Plumbing", labelTe: "ఎలక్ట్రికల్ & ప్లంబింగ్", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { value: "APPROVAL", labelEn: "Sanctions & Permits", labelTe: "ప్రభుత్వ అనుమతులు", color: "bg-rose-50 text-rose-800 border-rose-200" },
  { value: "SITE_PHOTO", labelEn: "Site Progress Photos", labelTe: "సైట్ ఫోటోలు", color: "bg-cyan-50 text-cyan-800 border-cyan-200" },
  { value: "CONTRACT", labelEn: "Contracts & Deeds", labelTe: "అగ్రిమెంట్లు", color: "bg-slate-50 text-slate-800 border-slate-200" },
  { value: "OTHER", labelEn: "Other Files", labelTe: "ఇతర ఫైళ్ళు", color: "bg-gray-50 text-gray-800 border-gray-200" },
] as const;

const QUICK_TITLE_SUGGESTIONS = [
  { en: "Ground Floor 2BHK Architectural Working Plan", te: "గ్రౌండ్ ఫ్లోర్ ఆర్కిటెక్చరల్ ప్లాన్", cat: "FLOOR_PLAN" },
  { en: "First Floor Plan & Terrace Sit-out Layout", te: "మొదటి అంతస్తు & టెర్రస్ ప్లాన్", cat: "FLOOR_PLAN" },
  { en: "Front 3D Modern Villa Elevation Rendering", te: "ముందు వైపు 3D ఆధునిక ఎలివేషన్", cat: "ELEVATION" },
  { en: "Side & Night Lighting 3D Elevation", te: "నైట్ లైటింగ్ 3D ఎలివేషన్ డిజైన్", cat: "ELEVATION" },
  { en: "Column Footing & Plinth Beam Structural Details", te: "పిల్లర్ ఫుటింగ్ & ప్లింత్ బీమ్ డ్రాయింగ్", cat: "STRUCTURAL" },
  { en: "Roof Slab Rebar Reinforcement Schedule", te: "రూఫ్ స్లాబ్ స్టీల్ బైండింగ్ డ్రాయింగ్", cat: "STRUCTURAL" },
  { en: "Electrical Conduit Point Marking & DB Circuits", te: "ఎలక్ట్రికల్ పాయింట్ మార్కింగ్ ప్లాన్", cat: "MEP" },
  { en: "Concealed CPVC Plumbing & Drainage Layout", te: "ప్లంబింగ్ పైపులు & డ్రైనేజీ ప్లాన్", cat: "MEP" },
  { en: "Municipal / BBMP Building Sanction Permit", te: "మున్సిపల్ బిల్డింగ్ పర్మిట్ ఆర్డర్", cat: "APPROVAL" },
  { en: "Temporary Power & Borewell Permission Deed", te: "విద్యుత్ & బోరు బావి అనుమతి పత్రం", cat: "APPROVAL" },
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [lightboxDoc, setLightboxDoc] = useState<DocumentItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  // Filter documents
  const filteredDocs = useMemo(() => {
    return documents
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .filter((doc) => {
        if (activeTab !== "ALL" && doc.category !== activeTab) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          (doc.description && doc.description.toLowerCase().includes(q)) ||
          (doc.version && doc.version.toLowerCase().includes(q)) ||
          doc.fileName.toLowerCase().includes(q)
        );
      });
  }, [documents, activeTab, search]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocCategoryObj = (cat: string) => {
    return CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[0];
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Header Banner with Direct Upload Action */}
      <div className="rounded-3xl bg-gradient-to-r from-clay-900 via-clay-800 to-clay-700 text-white p-6 sm:p-7 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📐</span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              {t.documents.title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-clay-200 max-w-2xl font-medium">
            {t.documents.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingDoc(null);
            setShowUploadModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-clay-900 shadow-sm hover:bg-clay-50 active:scale-95 transition whitespace-nowrap"
        >
          <Plus className="h-4 w-4 text-clay-600 stroke-[3]" />
          <span>{t.documents.uploadBtn}</span>
        </button>
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-paper-100/90 rounded-2xl border border-paper-200">
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs",
            activeTab === "ALL"
              ? "bg-clay-600 text-white shadow-sm"
              : "bg-white text-ink-700 hover:bg-paper-50"
          )}
        >
          <span>{t.documents.tabAll}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px]",
              activeTab === "ALL" ? "bg-clay-700 text-white" : "bg-paper-100 text-ink-500 font-semibold"
            )}
          >
            {documents.length}
          </span>
        </button>

        {CATEGORIES.map((cat) => {
          const count = documents.filter((d) => d.category === cat.value).length;
          const label = language === "te" ? cat.labelTe : cat.labelEn;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveTab(cat.value)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs",
                activeTab === cat.value
                  ? "bg-clay-600 text-white shadow-sm"
                  : "bg-white text-ink-700 hover:bg-paper-50"
              )}
            >
              <span>{label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px]",
                  activeTab === cat.value ? "bg-clay-700 text-white" : "bg-paper-100 text-ink-500 font-semibold"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search and Count Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder={language === "te" ? "ప్లాన్ పేరు లేదా వివరాల ద్వారా వెతకండి..." : "Search plans, drawings, revisions..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-paper-300 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-xs"
          />
        </div>
        <p className="text-xs text-ink-500 font-medium whitespace-nowrap">
          {language === "te" ? `మొత్తం ${filteredDocs.length} ప్లాన్లు` : `Showing ${filteredDocs.length} blueprints`}
        </p>
      </div>

      {/* 4. Blueprints Grid */}
      {filteredDocs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-paper-300 bg-white p-12 text-center space-y-4">
          <span className="text-5xl">📐</span>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-ink-900 text-base sm:text-lg">
              {t.documents.noDocsFound}
            </h3>
            <p className="text-xs text-ink-500 max-w-md mx-auto leading-relaxed">
              {t.documents.noDocsSub}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-clay-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-clay-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{t.documents.uploadBtn}</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => {
            const catObj = getDocCategoryObj(doc.category);
            const isImage = doc.mimeType.startsWith("image/");
            const isPdf = doc.mimeType === "application/pdf";
            const fileUrl = doc.storagePath.startsWith("/images/") ? doc.storagePath : `/api/documents/${doc.id}`;

            return (
              <div
                key={doc.id}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border bg-white shadow-xs hover:border-clay-300 hover:shadow-md transition flex flex-col justify-between",
                  doc.isPinned ? "border-amber-300 ring-1 ring-amber-300/50" : "border-paper-200"
                )}
              >
                <div>
                  {/* Visual Preview / Thumbnail Area */}
                  <div className="relative h-48 w-full overflow-hidden bg-paper-100 flex items-center justify-center">
                    {isImage ? (
                      <>
                        <Image
                          src={fileUrl}
                          alt={doc.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200 shadow-2xs">
                          <FileText className="h-8 w-8" />
                        </div>
                        <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 uppercase">
                          PDF Document
                        </span>
                        <p className="text-[11px] font-semibold text-ink-600 max-w-[200px] truncate">
                          {doc.fileName}
                        </p>
                      </div>
                    )}

                    {/* Top Badges (Category & Pin) */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
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
                            ? "bg-amber-400 text-amber-950 font-bold"
                            : "bg-white/80 text-ink-600 hover:bg-white"
                        )}
                        title={doc.isPinned ? t.documents.unpin : t.documents.pin}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* View Button Overlay */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isImage) {
                          setLightboxDoc(doc);
                        } else {
                          window.open(fileUrl, "_blank");
                        }
                      }}
                      className="absolute bottom-3 right-3 rounded-full bg-white/90 p-2 text-ink-900 shadow-md backdrop-blur-md hover:bg-white transition active:scale-95"
                      title={t.documents.viewFull}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Document Card Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-ink-900 text-sm sm:text-base leading-snug">
                        {doc.title}
                      </h3>
                    </div>

                    {doc.version && (
                      <span className="inline-block rounded-md bg-clay-50 border border-clay-200 px-2 py-0.5 text-[10px] font-bold text-clay-800">
                        {doc.version}
                      </span>
                    )}

                    {doc.description && (
                      <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[11px] text-ink-400 font-medium border-t border-paper-100">
                      <span>{formatFileSize(doc.sizeBytes)}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 pt-0 border-t border-paper-100 mt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
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
                      <span>💬 WA</span>
                    </a>
                  </div>

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
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Upload Blueprint Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative max-w-xl w-full rounded-3xl bg-white shadow-2xl p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-paper-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📐</span>
                <h3 className="font-display font-bold text-ink-900 text-lg">
                  {t.documents.uploadModalTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-full p-1.5 text-ink-400 hover:bg-paper-100 hover:text-ink-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const formElement = e.currentTarget;
                const formData = new FormData(formElement);
                start(async () => {
                  const res = await uploadDocument(projectId, formData);
                  if (res?.error) {
                    alert(res.error);
                    return;
                  }
                  setShowUploadModal(false);
                  router.refresh();
                });
              }}
            >
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1.5">
                  {t.documents.docCategory} <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  required
                  defaultValue="FLOOR_PLAN"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3.5 py-2.5 text-xs font-bold text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
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
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {t.documents.docTitle} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder={t.documents.docTitlePlaceholder}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3.5 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
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
                      className="rounded-md bg-paper-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600 hover:bg-clay-50 hover:text-clay-700 transition"
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
                    : "Supports Images (JPG, PNG, WebP) or PDF Plans & Blueprints (Up to 20 MB)"
                }
              />

              {/* Version & Floor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-800 mb-1">
                    {t.documents.version}
                  </label>
                  <input
                    type="text"
                    name="version"
                    placeholder={t.documents.versionPlaceholder}
                    className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-800 mb-1">
                    {language === "te" ? "అంతస్తు (Floor)" : "Floor Link (Optional)"}
                  </label>
                  <select
                    name="floorId"
                    className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
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
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {t.documents.description}
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder={t.documents.descriptionPlaceholder}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
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
                <label htmlFor="isPinnedCheck" className="text-xs font-bold text-ink-800 cursor-pointer">
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

      {/* 6. Fullscreen Image Lightbox Modal */}
      {lightboxDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="relative max-w-4xl w-full overflow-hidden rounded-3xl bg-black shadow-2xl space-y-3 p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between text-white border-b border-white/10 pb-2">
              <div>
                <span className="text-xs font-bold text-clay-400">
                  {getDocCategoryObj(lightboxDoc.category).labelEn}
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg">
                  {lightboxDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxDoc(null)}
                className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="relative h-[65vh] w-full overflow-hidden rounded-2xl bg-neutral-900 flex items-center justify-center">
              <Image
                src={lightboxDoc.storagePath.startsWith("/images/") ? lightboxDoc.storagePath : `/api/documents/${lightboxDoc.id}`}
                alt={lightboxDoc.title}
                fill
                className="object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-white/80 pt-1">
              <p className="font-medium max-w-md truncate">
                {lightboxDoc.description ?? lightboxDoc.fileName}
              </p>
              <a
                href={lightboxDoc.storagePath.startsWith("/images/") ? lightboxDoc.storagePath : `/api/documents/${lightboxDoc.id}`}
                download={lightboxDoc.fileName}
                className="inline-flex items-center gap-1 rounded-xl bg-white px-3.5 py-1.5 font-bold text-black hover:bg-neutral-200 transition shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{t.documents.download}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
