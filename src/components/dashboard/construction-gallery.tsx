"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/language-context";
import { formatINR } from "@/lib/money";
import { updateProjectName } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Camera,
  ChevronRight,
  Plus,
  Receipt,
  Sparkles,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Layers,
  Pencil,
} from "lucide-react";

export type StageGalleryItem = {
  id: string;
  step: number;
  name: string;
  nameTe: string;
  image: string;
  descriptionEn: string;
  descriptionTe: string;
  status: "COMPLETED" | "IN_PROGRESS" | "UPCOMING";
  spentAmount: number;
};

const DEFAULT_GALLERY_STAGES: StageGalleryItem[] = [
  {
    id: "stage-1",
    step: 1,
    name: "Architectural 3D Elevation & Planning",
    nameTe: "ప్లానింగ్ & 3D ఎలివేషన్ డిజైన్",
    image: "/images/stages/elevation.jpg",
    descriptionEn: "Sanctioned municipal house plans, 3D modern front elevation rendering, structural engineer soil testing and borewell drilling.",
    descriptionTe: "ఇంటి ప్లాన్ మంజూరు, ఆధునిక 3D ఎలివేషన్ డిజైన్ మరియు బోరు బావి పనులు.",
    status: "COMPLETED",
    spentAmount: 190000,
  },
  {
    id: "stage-2",
    step: 2,
    name: "Foundation Excavation & Footings",
    nameTe: "పునాది తవ్వకం & పిల్లర్ ఫుటింగ్ కాంక్రీట్",
    image: "/images/stages/foundation.jpg",
    descriptionEn: "Trench soil excavation, PCC bed, structural steel rebar footing cage, column starter marking and plinth beam casting.",
    descriptionTe: "పునాది గుంతల తవ్వకం, స్టీల్ పిల్లర్ కేజ్ బైండింగ్, PCC బెడ్ మరియు ప్లింత్ బీమ్ కాస్టింగ్.",
    status: "COMPLETED",
    spentAmount: 485000,
  },
  {
    id: "stage-3",
    step: 3,
    name: "Red Brick Masonry & Lintels",
    nameTe: "ఇటుక గోడల నిర్మాణం & లింటెల్స్",
    image: "/images/stages/brickwork.jpg",
    descriptionEn: "First-class table molded red clay brick masonry, cement mortar, concrete door/window lintel bands and curing.",
    descriptionTe: "నాణ్యమైన ఎర్ర ఇటుకలు, సిమెంట్ మోర్టార్ గోడలు, తలుపుల గుమ్మాలు మరియు లింటెల్స్.",
    status: "IN_PROGRESS",
    spentAmount: 340000,
  },
  {
    id: "stage-4",
    step: 4,
    name: "RCC Roof Slab Concreting",
    nameTe: "RCC స్లాబ్ సెంట్రింగ్ & కాంక్రీట్ పోరింగ్",
    image: "/images/stages/slab.jpg",
    descriptionEn: "Heavy-duty steel pipe shuttering, two-way slab rebar mesh binding, concealed electrical fan boxes & ready-mix concrete pouring.",
    descriptionTe: "స్టీల్ రాడ్ మెష్ బైండింగ్, ఎలక్ట్రికల్ పైపులు అమర్చడం మరియు మిషన్ కాంక్రీట్ స్లాబ్.",
    status: "UPCOMING",
    spentAmount: 0,
  },
  {
    id: "stage-5",
    step: 5,
    name: "Vitrified Marble & Tile Flooring",
    nameTe: "మార్బుల్ & ప్రీమియం టైల్స్ ఫ్లోరింగ్",
    image: "/images/stages/flooring.jpg",
    descriptionEn: "Glazed vitrified mirror-finish tiles, epoxy grouting, laser leveling spacers, anti-skid bathroom tiles and granite staircase steps.",
    descriptionTe: "ఇటాలియన్ మార్బుల్ లుక్ టైల్స్, లెవలింగ్ క్లిప్స్ మరియు బాత్రూమ్ వాల్ టైల్స్ పని.",
    status: "UPCOMING",
    spentAmount: 0,
  },
  {
    id: "stage-6",
    step: 6,
    name: "Modular Kitchen, Woodwork & Painting",
    nameTe: "మాడ్యులర్ కిచెన్, వుడ్‌వర్క్ & పెయింటింగ్",
    image: "/images/stages/interior.jpg",
    descriptionEn: "Teakwood main door, modular kitchen cabinets, premium false ceiling COB profile lights, wall putty primer and royal luxury emulsion.",
    descriptionTe: "తేకు తలుపులు, మోడ్రన్ కిచెన్ కేబినెట్స్, ఫాల్స్ సీలింగ్ లైట్లు మరియు రాయల్ పెయింట్స్.",
    status: "UPCOMING",
    spentAmount: 0,
  },
];

const QUICK_HOUSE_NAMES = [
  { en: "Sri Venkateswara Nilayam", te: "శ్రీ వేంకటేశ్వర నిలయం" },
  { en: "Whitefield Residence", te: "వైట్‌ఫీల్డ్ రెసిడెన్స్" },
  { en: "Sri Sai Krupa Villa", te: "శ్రీ సాయి కృప విల్లా" },
  { en: "Sri Lakshmi Nilayam", te: "శ్రీ లక్ష్మీ నిలయం" },
  { en: "Greenwood Villa", te: "గ్రీన్‌వుడ్ విల్లా" },
  { en: "My Dream Home", te: "మా కలల ఇల్లు" },
];

export function ConstructionGallery({
  projectId,
  projectName,
  location,
  totalBudget,
  totalSpent,
}: {
  projectId?: string;
  projectName: string;
  location?: string | null;
  totalBudget: number;
  totalSpent: number;
}) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [pending, start] = useTransition();

  const [selectedImage, setSelectedImage] = useState<StageGalleryItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "COMPLETED" | "IN_PROGRESS" | "UPCOMING">("ALL");

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState(projectName);
  const [newLocation, setNewLocation] = useState(location ?? "");

  const filteredStages = DEFAULT_GALLERY_STAGES.filter((s) => {
    if (activeFilter === "ALL") return true;
    return s.status === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* 1. House Spotlight Hero Card with Real Villa Photo */}
      <div className="relative overflow-hidden rounded-3xl bg-clay-950 text-white shadow-lg border border-clay-800">
        <div className="relative h-64 sm:h-80 w-full">
          <Image
            src="/images/stages/elevation.jpg"
            alt="Completed House Elevation"
            fill
            priority
            className="object-cover object-center brightness-[0.78] hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-clay-950 via-clay-950/40 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (projectId) {
                  setNewName(projectName);
                  setNewLocation(location ?? "");
                  setShowRenameModal(true);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/25 hover:bg-white/40 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-white shadow-xs transition active:scale-95 group"
              title={language === "te" ? "ఇంటి పేరు మార్చండి" : "Edit House Name"}
            >
              <span>🏡 {projectName}</span>
              <Pencil className="h-3 w-3 text-clay-200 group-hover:text-white transition" />
            </button>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 backdrop-blur-md px-3 py-1 text-xs font-extrabold text-white shadow-xs">
              ● {language === "te" ? "నిర్మాణంలో ఉంది" : "Active Construction"}
            </span>
          </div>

          {/* Bottom Banner Content */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-clay-200">
                {language === "te" ? "కలల ఇంటి ప్రాజెక్ట్" : "Dream House Project"}
              </span>

              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {projectName}
                </h2>
                {projectId && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewName(projectName);
                      setNewLocation(location ?? "");
                      setShowRenameModal(true);
                    }}
                    className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/40 backdrop-blur-md transition active:scale-95 shadow-xs"
                    title={language === "te" ? "ఇంటి పేరు సవరించండి" : "Edit House Name"}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="text-xs text-clay-200 font-medium">
                📍 {location ?? (language === "te" ? "హైదరాబాద్ / బెంగళూరు" : "Bengaluru")} · 2 Floors · 2,800 Sqft Built-up
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/documents"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-white/30 active:scale-95 transition"
              >
                <span>📐</span>
                <span>{language === "te" ? "ప్లాన్లు & ఎలివేషన్" : "Plans & 3D"}</span>
              </Link>

              <Link
                href="/expenses/new"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-clay-900 shadow-md hover:bg-clay-50 active:scale-95 transition"
              >
                <Plus className="h-4 w-4 text-clay-700 stroke-[3]" />
                <span>{t.dashboard.recordBillOrWages}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Construction Stages Photo Gallery */}
      <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-clay-600" />
              <h3 className="font-display text-lg sm:text-xl font-bold text-ink-900">
                {t.dashboard.constructionStagesGallery}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-ink-500 font-medium">
              {t.dashboard.constructionStagesGallerySub}
            </p>
          </div>

          <Link
            href="/stages"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-paper-300 bg-paper-50 px-4 py-2 text-xs font-bold text-ink-800 hover:bg-clay-50 hover:text-clay-700 hover:border-clay-300 transition shrink-0 self-start md:self-auto shadow-2xs"
          >
            <span>{language === "te" ? "అన్ని 20 దశలను చూడండి →" : "View All 20 Stages →"}</span>
          </Link>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "ALL", label: language === "te" ? "అన్ని దశలు (6)" : "All Stages (6)" },
              { id: "COMPLETED", label: language === "te" ? "పూర్తయినవి (2)" : "Completed (2)" },
              { id: "IN_PROGRESS", label: language === "te" ? "ప్రస్తుతం (1)" : "In Progress (1)" },
              { id: "UPCOMING", label: language === "te" ? "తదుపరివి (3)" : "Upcoming (3)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition",
                  activeFilter === tab.id
                    ? "bg-clay-600 text-white shadow-xs"
                    : "bg-paper-100 text-ink-700 hover:bg-paper-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stages Photo Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStages.map((stage) => {
            const title = language === "te" ? stage.nameTe : stage.name;
            const desc = language === "te" ? stage.descriptionTe : stage.descriptionEn;

            return (
              <div
                key={stage.id}
                className="group relative overflow-hidden rounded-3xl border border-paper-200 bg-white shadow-xs hover:border-clay-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Photo Container */}
                  <div className="relative h-44 w-full overflow-hidden bg-paper-100">
                    <Image
                      src={stage.image}
                      alt={title}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Step Number & Status Badge */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="rounded-xl bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-extrabold text-white">
                        {language === "te" ? `దశ ${stage.step}` : `Step ${stage.step}`}
                      </span>

                      {stage.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                          <CheckCircle2 className="h-3 w-3" />
                          {language === "te" ? "పూర్తయింది" : "Completed"}
                        </span>
                      )}

                      {stage.status === "IN_PROGRESS" && (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-xs animate-pulse">
                          <Clock className="h-3 w-3" />
                          {language === "te" ? "జరుగుతోంది" : "In Progress"}
                        </span>
                      )}

                      {stage.status === "UPCOMING" && (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-slate-700/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                          {language === "te" ? "తదుపరి దశ" : "Upcoming"}
                        </span>
                      )}
                    </div>

                    {/* Zoom Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedImage(stage)}
                      className="absolute bottom-3 right-3 rounded-full bg-white/80 p-1.5 text-ink-900 shadow-sm backdrop-blur-md hover:bg-white transition active:scale-95"
                      title="Enlarge photo"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/stages/${stage.step}`}
                        className="font-display font-bold text-ink-900 text-sm sm:text-base leading-snug hover:text-clay-600 transition"
                      >
                        {title}
                      </Link>
                    </div>
                    <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 pt-0 border-t border-paper-100 mt-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ink-400 block">
                      {language === "te" ? "అయిన ఖర్చు" : "Spent"}
                    </span>
                    <span className="font-extrabold text-ink-900 text-sm">
                      {stage.spentAmount > 0 ? formatINR(stage.spentAmount) : "--"}
                    </span>
                  </div>

                  <Link
                    href="/expenses/new"
                    className="inline-flex items-center gap-1 font-bold text-clay-700 hover:text-clay-900 transition bg-clay-50 hover:bg-clay-100 rounded-xl px-2.5 py-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{language === "te" ? "బిల్లు నమోదు" : "+ Add Bill"}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. High-Resolution Photo Zoom Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-w-3xl w-full overflow-hidden rounded-3xl bg-white shadow-2xl space-y-4 p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-paper-100 pb-3">
              <div>
                <span className="text-xs font-bold text-clay-600">
                  {language === "te" ? `దశ ${selectedImage.step}` : `Step ${selectedImage.step}`}
                </span>
                <h3 className="font-display font-bold text-ink-900 text-lg">
                  {language === "te" ? selectedImage.nameTe : selectedImage.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="rounded-full p-2 text-ink-400 hover:bg-paper-100 hover:text-ink-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-2xl bg-black">
              <Image
                src={selectedImage.image}
                alt={selectedImage.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-ink-600">
              <p className="font-medium max-w-xl">
                {language === "te" ? selectedImage.descriptionTe : selectedImage.descriptionEn}
              </p>
              <Link
                href="/expenses/new"
                onClick={() => setSelectedImage(null)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-clay-600 px-4 py-2.5 font-bold text-white shadow-sm hover:bg-clay-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>{language === "te" ? "ఈ దశకు బిల్లు నమోదు" : "Record Expense"}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Instant Rename House Modal */}
      {showRenameModal && projectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative max-w-md w-full rounded-3xl bg-white shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-paper-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏡</span>
                <h3 className="font-display font-bold text-ink-900 text-lg">
                  {language === "te" ? "ఇంటి పేరు సవరించండి" : "Edit House Name"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRenameModal(false)}
                className="rounded-full p-1.5 text-ink-400 hover:bg-paper-100 hover:text-ink-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                start(async () => {
                  const res = await updateProjectName(projectId, newName, newLocation);
                  if (res?.error) {
                    alert(res.error);
                    return;
                  }
                  setShowRenameModal(false);
                  router.refresh();
                });
              }}
            >
              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {language === "te" ? "ఇంటి పేరు (House Name)" : "House Project Name"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={language === "te" ? "ఉదా: శ్రీ వేంకటేశ్వర నిలయం" : "e.g. Sri Venkateswara Nilayam"}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3.5 py-2.5 text-sm font-bold text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none shadow-2xs"
                />

                {/* Quick Name Suggestions */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {QUICK_HOUSE_NAMES.map((sugg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewName(language === "te" ? sugg.te : sugg.en)}
                      className="rounded-md bg-paper-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600 hover:bg-clay-50 hover:text-clay-700 transition"
                    >
                      + {language === "te" ? sugg.te : sugg.en}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {language === "te" ? "ప్రాంతం / చిరునామా (Location)" : "Location / Area"}
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder={language === "te" ? "ఉదా: వైట్‌ఫీల్డ్, బెంగళూరు" : "e.g. Whitefield, Bengaluru"}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3.5 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none shadow-2xs"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-paper-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowRenameModal(false)}
                  className="w-1/3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-clay-600 hover:bg-clay-700 font-bold text-white text-xs py-2.5 rounded-xl shadow-sm"
                >
                  {pending ? (language === "te" ? "భద్రపరుస్తోంది..." : "Saving...") : (language === "te" ? "💾 పేరు భద్రపరచండి" : "💾 Save House Name")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
