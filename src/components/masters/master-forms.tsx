"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  createLabourCategory,
  createMaterialCategory,
  createServiceCategory,
  createVendor,
  createWorker,
  updateVendor,
  updateWorker,
  deleteVendor,
  deleteWorker,
  clearAllVendors,
  clearAllWorkers,
  clearAllPhoneDirectory,
} from "@/lib/actions/masters";
import { formatINR } from "@/lib/money";
import { getVendorTotal, getWorkerTotal, type ExpenseRecord } from "@/lib/finance/aggregations";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import {
  Search,
  Phone,
  PhoneCall,
  MessageCircle,
  Building2,
  User,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  HardHat,
  Briefcase,
  X,
  IndianRupee,
  Info,
  Store,
  Package,
  Hammer,
  Truck,
} from "lucide-react";
import { UpiPayModal, type PayRecipient } from "@/components/masters/upi-pay-modal";

type MaterialItem = { id: string; name: string; groupName: string | null };
type LabourItem = { id: string; name: string; groupName: string | null };
type VendorItem = {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};
type WorkerItem = {
  id: string;
  name: string;
  type: string;
  specialization: string | null;
  phone: string | null;
  notes: string | null;
};
type ServiceItem = { id: string; name: string };

const STAGE_GROUP_ORDER: Record<string, number> = {
  "Foundation / Earthwork": 1,
  "Civil / Structural": 2,
  "RCC / Roofing": 3,
  "Masonry": 4,
  "Electrical": 5,
  "Plumbing": 6,
  "Plastering": 7,
  "Waterproofing": 8,
  "Doors / Windows": 9,
  "Flooring": 10,
  "Painting": 11,
  "Wood / Interior": 12,
  "Grills / Metal": 13,
  "Civil / Masonry Labour": 2,
  "Electrical Labour": 5,
  "Plumbing Labour": 6,
  "Tile Labour": 10,
  "Painting Labour": 11,
  "Wood Labour": 12,
  "Grill / Fabrication Labour": 13,
  "Other Labour": 20,
};

const WORKER_TYPES = [
  { value: "MASON", labelEn: "Mason (Mistri)", labelTe: "మేస్త్రీ (Mason)" },
  { value: "GENERAL_LABOUR", labelEn: "General Labour (Mazdoor)", labelTe: "రోజువారీ కూలీ (Mazdoor)" },
  { value: "CARPENTER", labelEn: "Carpenter / Woodworker", labelTe: "వడ్రంగి (Carpenter)" },
  { value: "PLUMBER", labelEn: "Plumber & Sanitary", labelTe: "ప్లంబర్ (Plumber)" },
  { value: "ELECTRICIAN", labelEn: "Electrician & Wiring", labelTe: "ఎలక్ట్రీషియన్ (Electrician)" },
  { value: "TILE_WORKER", labelEn: "Tile & Marble Mason", labelTe: "టైల్స్ & మార్బుల్ మేస్త్రీ" },
  { value: "PAINTER", labelEn: "Painter & Putty", labelTe: "పెయింటర్ & పుట్టీ" },
  { value: "FABRICATOR", labelEn: "Welder / SS Fabricator", labelTe: "వెల్డర్ / గ్రిల్స్ ఫ్యాబ్రికేటర్" },
  { value: "CONTRACTOR", labelEn: "Labour Contractor", labelTe: "కాంట్రాక్టర్ (Contractor)" },
  { value: "OTHER", labelEn: "Other Worker", labelTe: "ఇతర వర్కర్" },
];

const SHOP_CATEGORY_PRESETS = [
  "Cement & Steel Dealer",
  "Sand, Bricks & Aggregate",
  "Electricals & Lighting",
  "Plumbing, Pipes & Sanitary",
  "Hardware & Tools Store",
  "Paints & Wall Putty",
  "Tiles, Marble & Granite",
  "Timber, Plywood & Doors",
  "Glass & UPVC Windows",
  "Fabrication & Steel Gates",
];

export function MasterForms({
  materials = [],
  labours = [],
  vendors = [],
  workers = [],
  services = [],
  expenses = [],
}: {
  materials?: MaterialItem[];
  labours?: LabourItem[];
  vendors?: VendorItem[];
  workers?: WorkerItem[];
  services?: ServiceItem[];
  expenses?: ExpenseRecord[];
}) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [pending, start] = useTransition();

  const [activeTab, setActiveTab] = useState<"VENDORS" | "WORKERS" | "MATERIALS" | "LABOURS" | "SERVICES">("VENDORS");
  const [search, setSearch] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Modal / Inline Edit States
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);
  const [editingWorker, setEditingWorker] = useState<WorkerItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "vendor" | "worker"; id: string; name: string } | null>(null);
  const [clearTarget, setClearTarget] = useState<"VENDORS" | "WORKERS" | "ALL" | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [payRecipient, setPayRecipient] = useState<PayRecipient | null>(null);
  const [showPayModal, setShowPayModal] = useState<boolean>(false);

  // Clean phone numbers for tel: and wa.me links
  const cleanPhone = (phone?: string | null) => {
    if (!phone) return "";
    return phone.replace(/[^\d+]/g, "");
  };

  const getWaLink = (phone?: string | null) => {
    const cleaned = cleanPhone(phone);
    if (!cleaned) return null;
    const num = cleaned.startsWith("+") ? cleaned.replace("+", "") : cleaned.length === 10 ? `91${cleaned}` : cleaned;
    return `https://wa.me/${num}`;
  };

  // Effective lists excluding optimistically/recently deleted items
  const effectiveVendors = useMemo(() => {
    return vendors.filter((v) => !deletedIds.has(v.id));
  }, [vendors, deletedIds]);

  const effectiveWorkers = useMemo(() => {
    return workers.filter((w) => !deletedIds.has(w.id));
  }, [workers, deletedIds]);

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return effectiveVendors
      .filter((v) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          (v.company && v.company.toLowerCase().includes(q)) ||
          (v.phone && v.phone.toLowerCase().includes(q)) ||
          (v.address && v.address.toLowerCase().includes(q))
        );
      });
  }, [effectiveVendors, search]);

  // Filtered Workers
  const filteredWorkers = useMemo(() => {
    return effectiveWorkers
      .filter((w) => {
        if (selectedTrade !== "ALL" && w.type !== selectedTrade) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          w.name.toLowerCase().includes(q) ||
          w.type.toLowerCase().includes(q) ||
          (w.phone && w.phone.toLowerCase().includes(q)) ||
          (w.specialization && w.specialization.toLowerCase().includes(q))
        );
      });
  }, [effectiveWorkers, search, selectedTrade]);

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return [...materials]
      .sort((a, b) => {
        const orderA = STAGE_GROUP_ORDER[a.groupName ?? ""] ?? 99;
        const orderB = STAGE_GROUP_ORDER[b.groupName ?? ""] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      })
      .filter((m) =>
        search
          ? m.name.toLowerCase().includes(search.toLowerCase()) ||
            (m.groupName && m.groupName.toLowerCase().includes(search.toLowerCase()))
          : true
      );
  }, [materials, search]);

  // Filtered Labours
  const filteredLabours = useMemo(() => {
    return [...labours]
      .sort((a, b) => {
        const orderA = STAGE_GROUP_ORDER[a.groupName ?? ""] ?? 99;
        const orderB = STAGE_GROUP_ORDER[b.groupName ?? ""] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      })
      .filter((l) =>
        search
          ? l.name.toLowerCase().includes(search.toLowerCase()) ||
            (l.groupName && l.groupName.toLowerCase().includes(search.toLowerCase()))
          : true
      );
  }, [labours, search]);

  const paginatedVendors = filteredVendors.slice((page - 1) * pageSize, page * pageSize);
  const paginatedWorkers = filteredWorkers.slice((page - 1) * pageSize, page * pageSize);
  const paginatedMaterials = filteredMaterials.slice((page - 1) * pageSize, page * pageSize);
  const paginatedLabours = filteredLabours.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-200/80 pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
            {t.masters.title}
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            {t.masters.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {((activeTab === "VENDORS" && effectiveVendors.length > 0) ||
            (activeTab === "WORKERS" && effectiveWorkers.length > 0) ||
            (effectiveVendors.length > 0 || effectiveWorkers.length > 0)) && (
            <button
              type="button"
              onClick={() =>
                setClearTarget(
                  activeTab === "VENDORS" ? "VENDORS" : activeTab === "WORKERS" ? "WORKERS" : "ALL"
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 hover:bg-red-100 px-3 py-2 text-xs font-bold text-red-700 shadow-2xs transition active:scale-95 cursor-pointer"
              title="Clear entries with a single click"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
              <span>
                {activeTab === "VENDORS"
                  ? language === "te"
                    ? `షాపులన్నీ తొలగించండి (${effectiveVendors.length})`
                    : `Clear All Shops (${effectiveVendors.length})`
                  : activeTab === "WORKERS"
                  ? language === "te"
                    ? `వర్కర్లందరినీ తొలగించండి (${effectiveWorkers.length})`
                    : `Clear All Workers (${effectiveWorkers.length})`
                  : language === "te"
                  ? "అన్నీ తొలగించండి"
                  : "Clear All"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("VENDORS")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-clay-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{t.masters.addNewShop}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("WORKERS")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-white px-3.5 py-2 text-xs font-bold text-ink-800 shadow-2xs hover:bg-paper-50 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{t.masters.addNewWorker}</span>
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 flex items-center justify-between shadow-2xs">
          <span>{deleteError}</span>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="text-red-600 hover:text-red-800 font-bold ml-3"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Directory Tab Navigation */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-paper-100/90 rounded-2xl border border-paper-200">
        {[
          { id: "VENDORS", label: t.masters.tabShops, count: effectiveVendors.length },
          { id: "WORKERS", label: t.masters.tabWorkers, count: effectiveWorkers.length },
          { id: "MATERIALS", label: t.masters.tabMaterials, count: materials.length },
          { id: "LABOURS", label: t.masters.tabLabour, count: labours.length },
          { id: "SERVICES", label: t.masters.tabMachinery, count: services.length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab);
              setSearch("");
              setPage(1);
            }}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs",
              activeTab === tab.id
                ? "bg-clay-600 text-white shadow-sm"
                : "bg-white text-ink-700 hover:bg-paper-50"
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px]",
                activeTab === tab.id ? "bg-clay-700 text-white" : "bg-paper-100 text-ink-500 font-semibold"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 1. TAB: SHOPS & VENDORS */}
      {activeTab === "VENDORS" && (
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          {/* Shop List & Search */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
                <input
                  type="text"
                  placeholder={t.masters.searchShops}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-2xl border border-paper-300 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-ink-500 font-medium whitespace-nowrap">
                  {language === "te" ? `మొత్తం ${filteredVendors.length} షాపులు` : `Showing ${filteredVendors.length} shops`}
                </p>
                {vendors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setClearTarget("VENDORS")}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-800 hover:underline bg-red-50/80 border border-red-200 rounded-lg px-2 py-0.5 transition cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                    <span>{language === "te" ? "షాపులన్నీ తొలగించు" : "Clear All"}</span>
                  </button>
                )}
              </div>
            </div>

            {filteredVendors.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-paper-300 bg-white p-10 text-center space-y-3">
                <Store className="h-10 w-10 text-ink-300 mx-auto" />
                <h3 className="font-bold text-ink-900 text-sm sm:text-base">
                  {language === "te" ? "షాపులు ఏవీ కనుగొనబడలేదు" : "No shops found"}
                </h3>
                <p className="text-xs text-ink-500 max-w-sm mx-auto">
                  {language === "te"
                    ? "కుడివైపు ఉన్న ఫారం ద్వారా కొత్త హార్డ్‌వేర్ షాప్ లేదా మెటీరియల్ డీలర్ వివరాలను నమోదు చేయండి."
                    : "Add your first hardware store or material dealer using the form on the right."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {paginatedVendors.map((vendor) => {
                  const total = getVendorTotal(expenses, vendor.id);
                  const waLink = getWaLink(vendor.phone);
                  const telPhone = cleanPhone(vendor.phone);

                  return (
                    <div
                      key={vendor.id}
                      className="rounded-3xl border border-paper-200 bg-white p-5 shadow-xs hover:border-clay-300 transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Header & Lifetime Spend */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-4 w-4 text-clay-600 shrink-0" />
                              <h3 className="font-bold text-ink-900 text-sm sm:text-base leading-snug">
                                {vendor.name}
                              </h3>
                            </div>
                            {vendor.company && (
                              <span className="inline-block rounded-md bg-paper-100 px-2 py-0.5 text-[11px] font-semibold text-ink-700 mt-1">
                                {vendor.company}
                              </span>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">
                              {t.masters.totalPaid}
                            </span>
                            <span className="rounded-lg bg-clay-50 px-2 py-0.5 text-xs font-extrabold text-clay-800">
                              {formatINR(total)}
                            </span>
                          </div>
                        </div>

                        {/* Mobile Number & Call/WhatsApp buttons */}
                        <div className="rounded-2xl bg-paper-50 p-3 border border-paper-200 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-ink-800">
                              <Phone className="h-3.5 w-3.5 text-clay-600" />
                              <span>{vendor.phone || <span className="text-ink-400 font-normal italic">{t.masters.noPhone}</span>}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                              {vendor.phone && (
                                <>
                                  <a
                                    href={`tel:${telPhone}`}
                                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white transition active:scale-95 shadow-xs whitespace-nowrap shrink-0"
                                    title="Call directly"
                                  >
                                    <PhoneCall className="h-3 w-3 shrink-0" />
                                    <span className="whitespace-nowrap">{t.masters.call}</span>
                                  </a>

                                  {waLink && (
                                    <a
                                      href={waLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-xl bg-[#25D366] hover:bg-[#20ba59] px-2.5 py-1 text-[11px] font-bold text-white transition active:scale-95 shadow-xs whitespace-nowrap shrink-0"
                                      title="Open WhatsApp chat"
                                    >
                                      <MessageCircle className="h-3 w-3 shrink-0" />
                                      <span className="whitespace-nowrap">WA</span>
                                    </a>
                                  )}
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setPayRecipient({
                                    id: vendor.id,
                                    name: vendor.name,
                                    phone: vendor.phone,
                                    type: "VENDOR",
                                    notes: vendor.notes,
                                  });
                                  setShowPayModal(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-xl bg-purple-600 hover:bg-purple-700 px-2.5 py-1 text-[11px] font-bold text-white transition active:scale-95 shadow-xs whitespace-nowrap shrink-0"
                                title="Pay via UPI"
                              >
                                <IndianRupee className="h-3 w-3 stroke-[2.5] shrink-0" />
                                <span className="whitespace-nowrap">{language === "te" ? "పే" : "Pay"}</span>
                              </button>
                            </div>
                          </div>

                          {vendor.address && (
                            <p className="text-[11px] text-ink-600 flex items-start gap-1">
                              <MapPin className="h-3 w-3 text-ink-400 shrink-0 mt-0.5" />
                              <span>{vendor.address}</span>
                            </p>
                          )}
                        </div>

                        {vendor.notes && (
                          <p className="text-xs text-ink-500 bg-paper-50/60 rounded-xl px-2.5 py-1.5 italic border border-paper-100 flex items-start gap-1">
                            <Info className="h-3.5 w-3.5 text-ink-400 shrink-0 mt-0.5" />
                            <span>{vendor.notes}</span>
                          </p>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-paper-100 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setEditingVendor(vendor)}
                          className="inline-flex items-center gap-1 font-semibold text-clay-700 hover:text-clay-900 transition"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>{t.masters.edit}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: "vendor", id: vendor.id, name: vendor.name })}
                          className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-800 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>{t.masters.delete}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredVendors.length > pageSize && (
              <TablePagination
                currentPage={page}
                totalItems={filteredVendors.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[6, 8, 12, 24]}
              />
            )}
          </div>

          {/* Add / Edit Shop Form */}
          <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4 sticky top-6">
            <div className="flex items-center justify-between gap-2 border-b border-paper-100 pb-3">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-clay-600" />
                <h3 className="font-display font-bold text-ink-900 text-base">
                  {editingVendor ? (language === "te" ? "షాప్ వివరాలు సవరించండి" : "Edit Shop Details") : t.masters.addNewShop}
                </h3>
              </div>
              {editingVendor && (
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="rounded-full p-1 text-ink-400 hover:bg-paper-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <form
              key={editingVendor ? editingVendor.id : "new-vendor"}
              className="space-y-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                const formElement = e.currentTarget;
                const form = new FormData(formElement);
                const payload = Object.fromEntries(form.entries());

                start(async () => {
                  if (editingVendor) {
                    await updateVendor(editingVendor.id, payload);
                    setEditingVendor(null);
                  } else {
                    await createVendor(payload);
                    formElement.reset();
                  }
                  router.refresh();
                });
              }}
            >
              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {t.masters.shopName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingVendor?.name ?? ""}
                  placeholder={language === "te" ? "ఉదా: శ్రీ బాలాజీ సిమెంట్ & స్టీల్" : "e.g. Sri Balaji Cement & Hardware"}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {t.masters.mobileNumber}
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={editingVendor?.phone ?? ""}
                  placeholder={language === "te" ? "ఉదా: 9876543210" : "e.g. 9876543210"}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {t.masters.businessType}
                </label>
                <input
                  type="text"
                  name="company"
                  defaultValue={editingVendor?.company ?? ""}
                  placeholder={language === "te" ? "ఉదా: సిమెంట్, ఇనుము, ఇసుక డీలర్" : "e.g. Cement & Steel Dealer"}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
                {/* Category Preset chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {SHOP_CATEGORY_PRESETS.slice(0, 4).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.closest("div")?.previousElementSibling as HTMLInputElement;
                        if (input) input.value = preset;
                      }}
                      className="rounded-md bg-paper-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600 hover:bg-clay-50 hover:text-clay-700 transition"
                    >
                      + {preset.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {t.masters.shopAddress}
                </label>
                <input
                  type="text"
                  name="address"
                  defaultValue={editingVendor?.address ?? ""}
                  placeholder={language === "te" ? "ఉదా: మెయిన్ రోడ్డు, సైట్ ఎదురుగా" : "e.g. Main Road, Near Site Junction"}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {t.masters.notes}
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingVendor?.notes ?? ""}
                  placeholder={language === "te" ? "ఉదా: Google Pay: 9876543210@upi, 30 రోజుల క్రెడిట్" : "e.g. UPI ID, Bank account, 30-day payment credit"}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                {editingVendor && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingVendor(null)}
                    className="w-1/3 text-xs"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-clay-600 hover:bg-clay-700 font-bold text-white text-xs py-2.5 rounded-xl shadow-sm"
                >
                  {pending ? t.masters.saving : editingVendor ? "Update Shop" : t.masters.saveShop}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. TAB: WORKERS & MASONS */}
      {activeTab === "WORKERS" && (
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          {/* Worker List & Filters */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
                <input
                  type="text"
                  placeholder={t.masters.searchWorkers}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-2xl border border-paper-300 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-ink-500 font-medium whitespace-nowrap">
                  {language === "te" ? `మొత్తం ${filteredWorkers.length} మంది వర్కర్లు` : `Showing ${filteredWorkers.length} workers`}
                </p>
                {workers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setClearTarget("WORKERS")}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-800 hover:underline bg-red-50/80 border border-red-200 rounded-lg px-2 py-0.5 transition cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                    <span>{language === "te" ? "వర్కర్లందరినీ తొలగించు" : "Clear All"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Trade Filter Pills */}
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedTrade("ALL");
                  setPage(1);
                }}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition",
                  selectedTrade === "ALL"
                    ? "bg-clay-600 text-white shadow-xs"
                    : "bg-white border border-paper-200 text-ink-700 hover:bg-paper-50"
                )}
              >
                {language === "te" ? "అన్ని రకాలు" : "All Trades"}
              </button>
              {WORKER_TYPES.map((wt) => (
                <button
                  key={wt.value}
                  type="button"
                  onClick={() => {
                    setSelectedTrade(wt.value);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition",
                    selectedTrade === wt.value
                      ? "bg-clay-600 text-white shadow-xs"
                      : "bg-white border border-paper-200 text-ink-700 hover:bg-paper-50"
                  )}
                >
                  {language === "te" ? wt.labelTe : wt.labelEn}
                </button>
              ))}
            </div>

            {filteredWorkers.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-paper-300 bg-white p-10 text-center space-y-3">
                <HardHat className="h-10 w-10 text-ink-300 mx-auto" />
                <h3 className="font-bold text-ink-900 text-sm sm:text-base">
                  {language === "te" ? "వర్కర్లు ఏవీ కనుగొనబడలేదు" : "No workers found"}
                </h3>
                <p className="text-xs text-ink-500 max-w-sm mx-auto">
                  {language === "te"
                    ? "కుడివైపు ఉన్న ఫారం ద్వారా కొత్త మేస్త్రీ లేదా కూలీ వివరాలను నమోదు చేయండి."
                    : "Add your first mason, plumber, electrician or labourer using the form on the right."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {paginatedWorkers.map((worker) => {
                  const total = getWorkerTotal(expenses, worker.id);
                  const waLink = getWaLink(worker.phone);
                  const telPhone = cleanPhone(worker.phone);

                  const workerTypeObj = WORKER_TYPES.find((wt) => wt.value === worker.type);
                  const typeDisplay = language === "te" && workerTypeObj ? workerTypeObj.labelTe : workerTypeObj?.labelEn ?? worker.type;

                  return (
                    <div
                      key={worker.id}
                      className="rounded-3xl border border-paper-200 bg-white p-5 shadow-xs hover:border-clay-300 transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Header & Lifetime Wages */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <User className="h-4 w-4 text-amber-600 shrink-0" />
                              <h3 className="font-bold text-ink-900 text-sm sm:text-base leading-snug">
                                {worker.name}
                              </h3>
                            </div>
                            <span className="inline-block rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-900 mt-1">
                              {typeDisplay}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">
                              {t.masters.totalPaid}
                            </span>
                            <span className="rounded-lg bg-amber-50/80 px-2 py-0.5 text-xs font-extrabold text-amber-900">
                              {formatINR(total)}
                            </span>
                          </div>
                        </div>

                        {/* Mobile Number & Direct Call/WhatsApp buttons */}
                        <div className="rounded-2xl bg-paper-50 p-3 border border-paper-200 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-ink-800">
                              <Phone className="h-3.5 w-3.5 text-amber-600" />
                              <span>{worker.phone || <span className="text-ink-400 font-normal italic">{t.masters.noPhone}</span>}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                              {worker.phone && (
                                <>
                                  <a
                                    href={`tel:${telPhone}`}
                                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white transition active:scale-95 shadow-xs whitespace-nowrap shrink-0"
                                    title="Call worker directly"
                                  >
                                    <PhoneCall className="h-3 w-3 shrink-0" />
                                    <span className="whitespace-nowrap">{t.masters.call}</span>
                                  </a>

                                  {waLink && (
                                    <a
                                      href={waLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-xl bg-[#25D366] hover:bg-[#20ba59] px-2.5 py-1 text-[11px] font-bold text-white transition active:scale-95 shadow-xs whitespace-nowrap shrink-0"
                                      title="Open WhatsApp chat"
                                    >
                                      <MessageCircle className="h-3 w-3 shrink-0" />
                                      <span className="whitespace-nowrap">WA</span>
                                    </a>
                                  )}
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setPayRecipient({
                                    id: worker.id,
                                    name: worker.name,
                                    phone: worker.phone,
                                    type: "WORKER",
                                    notes: worker.notes,
                                  });
                                  setShowPayModal(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-xl bg-purple-600 hover:bg-purple-700 px-2.5 py-1 text-[11px] font-bold text-white transition active:scale-95 shadow-xs whitespace-nowrap shrink-0"
                                title="Pay via UPI"
                              >
                                <IndianRupee className="h-3 w-3 stroke-[2.5] shrink-0" />
                                <span className="whitespace-nowrap">{language === "te" ? "పే" : "Pay"}</span>
                              </button>
                            </div>
                          </div>

                          {worker.specialization && (
                            <p className="text-[11px] text-ink-700 flex items-start gap-1 font-medium">
                              <Briefcase className="h-3 w-3 text-ink-400 shrink-0 mt-0.5" />
                              <span>{worker.specialization}</span>
                            </p>
                          )}
                        </div>

                        {worker.notes && (
                          <p className="text-xs text-ink-500 bg-paper-50/60 rounded-xl px-2.5 py-1.5 italic border border-paper-100 flex items-start gap-1">
                            <Info className="h-3.5 w-3.5 text-ink-400 shrink-0 mt-0.5" />
                            <span>{worker.notes}</span>
                          </p>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-paper-100 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setEditingWorker(worker)}
                          className="inline-flex items-center gap-1 font-semibold text-clay-700 hover:text-clay-900 transition"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>{t.masters.edit}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: "worker", id: worker.id, name: worker.name })}
                          className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-800 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>{t.masters.delete}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredWorkers.length > pageSize && (
              <TablePagination
                currentPage={page}
                totalItems={filteredWorkers.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[6, 8, 12, 24]}
              />
            )}
          </div>

          {/* Add / Edit Worker Form */}
          <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4 sticky top-6">
            <div className="flex items-center justify-between gap-2 border-b border-paper-100 pb-3">
              <div className="flex items-center gap-2">
                <HardHat className="h-5 w-5 text-clay-600" />
                <h3 className="font-display font-bold text-ink-900 text-base">
                  {editingWorker ? (language === "te" ? "వర్కర్ వివరాలు సవరించండి" : "Edit Worker Details") : t.masters.addNewWorker}
                </h3>
              </div>
              {editingWorker && (
                <button
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className="rounded-full p-1 text-ink-400 hover:bg-paper-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <form
              key={editingWorker ? editingWorker.id : "new-worker"}
              className="space-y-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                const formElement = e.currentTarget;
                const form = new FormData(formElement);
                const payload = Object.fromEntries(form.entries());

                start(async () => {
                  if (editingWorker) {
                    await updateWorker(editingWorker.id, payload);
                    setEditingWorker(null);
                  } else {
                    await createWorker(payload);
                    formElement.reset();
                  }
                  router.refresh();
                });
              }}
            >
              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {t.masters.workerName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingWorker?.name ?? ""}
                  placeholder={language === "te" ? "ఉదా: రమణ మేస్త్రీ / శేఖర్ ప్లంబర్" : "e.g. Ramana Mason / Sekhar Plumber"}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {t.masters.tradeRole} <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  required
                  defaultValue={editingWorker?.type ?? "MASON"}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                >
                  {WORKER_TYPES.map((wt) => (
                    <option key={wt.value} value={wt.value}>
                      {language === "te" ? wt.labelTe : wt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {t.masters.mobileNumber}
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={editingWorker?.phone ?? ""}
                  placeholder={language === "te" ? "ఉదా: 9876543210" : "e.g. 9876543210"}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {t.masters.specialization}
                </label>
                <input
                  type="text"
                  name="specialization"
                  defaultValue={editingWorker?.specialization ?? ""}
                  placeholder={language === "te" ? "ఉదా: స్లాబ్ కాంక్రీట్, గ్రౌండ్ ఫ్లోర్ టైల్స్, పుట్టీ" : "e.g. Slab Concreting, Italian Marble, False Ceiling"}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  {t.masters.notes}
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingWorker?.notes ?? ""}
                  placeholder={language === "te" ? "ఉదా: రోజు కూలీ ₹850, PhonePe: 9876543210" : "e.g. Daily wage ₹850/day, PhonePe: 9876543210"}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                {editingWorker && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingWorker(null)}
                    className="w-1/3 text-xs"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-clay-600 hover:bg-clay-700 font-bold text-white text-xs py-2.5 rounded-xl shadow-sm"
                >
                  {pending ? t.masters.saving : editingWorker ? "Update Worker" : t.masters.saveWorker}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. TAB: MATERIALS CATALOG */}
      {activeTab === "MATERIALS" && (
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search materials or construction groups..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-paper-300 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-xs"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {paginatedMaterials.map((mat) => (
                <div key={mat.id} className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-1">
                  <p className="font-bold text-ink-900 text-sm">{mat.name}</p>
                  <p className="text-xs text-ink-500">{mat.groupName ?? "Custom"}</p>
                </div>
              ))}
            </div>

            {filteredMaterials.length > pageSize && (
              <TablePagination
                currentPage={page}
                totalItems={filteredMaterials.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[8, 16, 32]}
              />
            )}
          </div>

          {/* Add Material Category */}
          <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-clay-600" />
              <h3 className="font-bold text-ink-900 text-sm">Add Material Item</h3>
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const formElement = e.currentTarget;
                const form = new FormData(formElement);
                start(async () => {
                  await createMaterialCategory(Object.fromEntries(form.entries()));
                  formElement.reset();
                  router.refresh();
                });
              }}
            >
              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">Material Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Fly Ash Bricks"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">Stage Group</label>
                <input
                  type="text"
                  name="groupName"
                  placeholder="e.g. Civil / Structural"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <Button type="submit" disabled={pending} className="w-full bg-clay-600 hover:bg-clay-700 font-bold text-white text-xs py-2.5">
                {pending ? "Adding..." : "Add Material"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* 4. TAB: LABOUR TRADES */}
      {activeTab === "LABOURS" && (
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search labour trades..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-paper-300 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-xs"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {paginatedLabours.map((lab) => (
                <div key={lab.id} className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-1">
                  <p className="font-bold text-ink-900 text-sm">{lab.name}</p>
                  <p className="text-xs text-ink-500">{lab.groupName ?? "Custom"}</p>
                </div>
              ))}
            </div>

            {filteredLabours.length > pageSize && (
              <TablePagination
                currentPage={page}
                totalItems={filteredLabours.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[8, 16, 32]}
              />
            )}
          </div>

          {/* Add Labour Category */}
          <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Hammer className="h-5 w-5 text-clay-600" />
              <h3 className="font-bold text-ink-900 text-sm">Add Labour Trade</h3>
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const formElement = e.currentTarget;
                const form = new FormData(formElement);
                start(async () => {
                  await createLabourCategory(Object.fromEntries(form.entries()));
                  formElement.reset();
                  router.refresh();
                });
              }}
            >
              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">Trade Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. False Ceiling Labour"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">Stage Group</label>
                <input
                  type="text"
                  name="groupName"
                  placeholder="e.g. Civil / Masonry Labour"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <Button type="submit" disabled={pending} className="w-full bg-clay-600 hover:bg-clay-700 font-bold text-white text-xs py-2.5">
                {pending ? "Adding..." : "Add Labour Trade"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* 5. TAB: SERVICES & MACHINERY */}
      {activeTab === "SERVICES" && (
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((srv) => (
                <div key={srv.id} className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs">
                  <p className="font-bold text-ink-900 text-sm">{srv.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-clay-600" />
              <h3 className="font-bold text-ink-900 text-sm">Add Service / Machinery</h3>
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const formElement = e.currentTarget;
                const form = new FormData(formElement);
                start(async () => {
                  await createServiceCategory(Object.fromEntries(form.entries()));
                  formElement.reset();
                  router.refresh();
                });
              }}
            >
              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">Service / Equipment Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Tractor Sand Transport"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <Button type="submit" disabled={pending} className="w-full bg-clay-600 hover:bg-clay-700 font-bold text-white text-xs py-2.5">
                {pending ? "Adding..." : "Add Service"}
              </Button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (!deleteTarget || isDeleting) return;
          const target = deleteTarget;
          setIsDeleting(true);
          setDeleteError(null);

          try {
            const res =
              target.type === "vendor"
                ? await deleteVendor(target.id)
                : await deleteWorker(target.id);
            if (res && "error" in res && res.error) {
              setDeleteError(res.error);
              setIsDeleting(false);
              return;
            }
            // Immediately remove from local UI so it vanishes as soon as dialog closes
            setDeletedIds((prev) => new Set(prev).add(target.id));
            setDeleteTarget(null);
            router.refresh();
          } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "Failed to delete entry");
          } finally {
            setIsDeleting(false);
          }
        }}
        title={deleteTarget?.type === "vendor" ? (language === "te" ? "వెండర్ / షాప్‌ను తొలగించాలా?" : "Delete Vendor / Store") : (language === "te" ? "వర్కర్‌ను తొలగించాలా?" : "Delete Construction Worker")}
        description={
          language === "te"
            ? `మీరు ఖచ్చితంగా "${deleteTarget?.name ?? "ఈ వివరాలను"}" తొలగించాలనుకుంటున్నారా? ఈ చర్యను రద్దు చేయలేము.`
            : `Are you sure you want to delete "${deleteTarget?.name ?? "this entry"}"? This action cannot be undone.`
        }
        confirmText={language === "te" ? "తొలగించు" : "Delete"}
        loading={isDeleting}
      />

      {/* Clear All Confirmation Dialog */}
      <ConfirmDialog
        open={!!clearTarget}
        onClose={() => {
          if (!isDeleting) setClearTarget(null);
        }}
        onConfirm={async () => {
          if (!clearTarget || isDeleting) return;
          const target = clearTarget;
          setIsDeleting(true);
          setDeleteError(null);

          try {
            const res =
              target === "VENDORS"
                ? await clearAllVendors()
                : target === "WORKERS"
                ? await clearAllWorkers()
                : await clearAllPhoneDirectory();

            if (res && "error" in res && res.error) {
              setDeleteError(res.error);
              setIsDeleting(false);
              return;
            }
            // Immediately filter all cleared items from local UI so they vanish instantly
            if (target === "VENDORS") {
              setDeletedIds((prev) => {
                const next = new Set(prev);
                vendors.forEach((v) => next.add(v.id));
                return next;
              });
            } else if (target === "WORKERS") {
              setDeletedIds((prev) => {
                const next = new Set(prev);
                workers.forEach((w) => next.add(w.id));
                return next;
              });
            } else {
              setDeletedIds((prev) => {
                const next = new Set(prev);
                vendors.forEach((v) => next.add(v.id));
                workers.forEach((w) => next.add(w.id));
                return next;
              });
            }
            setClearTarget(null);
            router.refresh();
          } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "Failed to clear entries");
          } finally {
            setIsDeleting(false);
          }
        }}
        title={
          clearTarget === "VENDORS"
            ? (language === "te" ? "షాపులన్నీ ఒకేసారి తొలగించాలా?" : "Clear All Shops & Vendors?")
            : clearTarget === "WORKERS"
            ? (language === "te" ? "వర్కర్లందరినీ ఒకేసారి తొలగించాలా?" : "Clear All Workers & Contractors?")
            : (language === "te" ? "కాంటాక్ట్‌లన్నీ ఒకేసారి తొలగించాలా?" : "Clear All Phone Directory Entries?")
        }
        description={
          clearTarget === "VENDORS"
            ? (language === "te"
                ? `మీరు ఖచ్చితంగా మొత్తం ${effectiveVendors.length} షాపులు/వెండర్లను ఒకే క్లిక్‌తో శాశ్వతంగా తొలగించాలనుకుంటున్నారా? ఈ చర్యను రద్దు చేయలేము.`
                : `Are you sure you want to delete all ${effectiveVendors.length} shops & vendors in a single click? This action cannot be undone.`)
            : clearTarget === "WORKERS"
            ? (language === "te"
                ? `మీరు ఖచ్చితంగా మొత్తం ${effectiveWorkers.length} వర్కర్లను ఒకే క్లిక్‌తో శాశ్వతంగా తొలగించాలనుకుంటున్నారా? ఈ చర్యను రద్దు చేయలేము.`
                : `Are you sure you want to delete all ${effectiveWorkers.length} workers & contractors in a single click? This action cannot be undone.`)
            : (language === "te"
                ? `మీరు ఖచ్చితంగా ఫోన్ డైరెక్టరీలోని అన్ని ఎంట్రీలను ఒకే క్లిక్‌తో శాశ్వతంగా తొలగించాలనుకుంటున్నారా? ఈ చర్యను రద్దు చేయలేము.`
                : `Are you sure you want to delete all phone directory entries in a single click? This action cannot be undone.`)
        }
        confirmText={
          language === "te"
            ? `అన్నీ తొలగించు (${clearTarget === "VENDORS" ? effectiveVendors.length : clearTarget === "WORKERS" ? effectiveWorkers.length : effectiveVendors.length + effectiveWorkers.length})`
            : `Clear All (${clearTarget === "VENDORS" ? effectiveVendors.length : clearTarget === "WORKERS" ? effectiveWorkers.length : effectiveVendors.length + effectiveWorkers.length})`
        }
        loading={isDeleting}
      />

      <UpiPayModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        recipient={payRecipient}
        language={language}
      />
    </div>
  );
}
