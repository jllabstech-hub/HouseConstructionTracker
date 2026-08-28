"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Search,
  Trash2,
} from "lucide-react";
import { LeadStatus } from "@prisma/client";
import { updateLeadStatus, deleteLead } from "@/lib/actions/leads";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLanguage } from "@/context/language-context";

export type SerializedLead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  location: string;
  plotArea: string | null;
  builtUpArea: string | null;
  floors: string | null;
  budget: string | null;
  constructionStage: string | null;
  requirements: string | null;
  status: LeadStatus;
  createdAt: string;
};

export function LeadsManagement({ initialLeads }: { initialLeads: SerializedLead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [pending, start] = useTransition();
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const { t } = useLanguage();

  const statusTone: Record<LeadStatus, { label: string; bg: string; text: string; border: string }> = {
    NEW: { label: t.leads.statusNew, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    CONTACTED: { label: t.leads.statusContacted, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    SITE_VISIT: { label: t.leads.statusSiteVisit, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    ESTIMATE_SENT: { label: t.leads.statusEstimateSent, bg: "bg-clay-50", text: "text-clay-800", border: "border-clay-200" },
    NEGOTIATION: { label: t.leads.statusNegotiation, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    WON: { label: t.leads.statusWon, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    LOST: { label: t.leads.statusLost, bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
  };

  const filtered = leads.filter((lead) => {
    if (selectedStatus !== "ALL" && lead.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        lead.location.toLowerCase().includes(q) ||
        (lead.email && lead.email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    start(async () => {
      await updateLeadStatus(leadId, newStatus);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
    });
  };

  const handleDelete = (leadId: string) => {
    setLeadToDelete(leadId);
  };

  const counts: Record<string, number> = {
    ALL: leads.length,
    NEW: leads.filter((l) => l.status === "NEW").length,
    CONTACTED: leads.filter((l) => l.status === "CONTACTED").length,
    SITE_VISIT: leads.filter((l) => l.status === "SITE_VISIT").length,
    ESTIMATE_SENT: leads.filter((l) => l.status === "ESTIMATE_SENT").length,
    WON: leads.filter((l) => l.status === "WON").length,
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="border-b border-paper-200/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-clay-700 block">
            {t.leads.headerTag}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-1">
            {t.leads.title}
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            {t.leads.subtitle}
          </p>
        </div>

        <div className="text-xs font-bold text-ink-600 bg-white border border-paper-200 rounded-xl px-3.5 py-2 shadow-2xs">
          {t.leads.totalInquiries}: <strong className="text-ink-900">{leads.length}</strong>
        </div>
      </div>

      {/* 2. Pipeline Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="overflow-x-auto pb-1 max-w-full">
          <SegmentedControl
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: "ALL", label: t.leads.tabAll, count: counts.ALL },
              { value: "NEW", label: t.leads.tabNew, count: counts.NEW },
              { value: "CONTACTED", label: t.leads.tabContacted, count: counts.CONTACTED },
              { value: "SITE_VISIT", label: t.leads.tabSiteVisit, count: counts.SITE_VISIT },
              { value: "ESTIMATE_SENT", label: t.leads.tabEstimateSent, count: counts.ESTIMATE_SENT },
              { value: "WON", label: t.leads.tabWon, count: counts.WON },
            ]}
          />
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.leads.searchPlaceholder}
            className="w-full rounded-xl border border-paper-300 bg-white pl-9 pr-3 py-2 text-xs text-ink-900 placeholder:text-ink-400 focus:border-clay-600 focus:outline-hidden transition"
          />
        </div>
      </div>

      {/* 3. Leads List */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((lead) => {
            const tone = statusTone[lead.status] || statusTone.NEW;
            return (
              <div
                key={lead.id}
                className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-4 hover:border-clay-200 transition"
              >
                {/* Top: Name, Status & Date */}
                <div className="flex items-start justify-between gap-3 border-b border-paper-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-bold text-ink-900">
                        {lead.name}
                      </h3>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${tone.bg} ${tone.text} ${tone.border}`}
                      >
                        {tone.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-clay-600" />
                      <span>{lead.location}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-ink-400 block">{lead.createdAt}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(lead.id)}
                      className="text-[10px] text-ink-400 hover:text-red-600 transition mt-1"
                      title={t.leads.deleteConfirm}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Project Specs Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-paper-50 p-2">
                    <span className="text-[10px] font-bold text-ink-400 uppercase block">{t.leads.budget}</span>
                    <span className="font-bold text-ink-900">{lead.budget || t.leads.notSpecified}</span>
                  </div>

                  <div className="rounded-lg bg-paper-50 p-2">
                    <span className="text-[10px] font-bold text-ink-400 uppercase block">{t.leads.floors}</span>
                    <span className="font-bold text-ink-900">{lead.floors || "G+1"}</span>
                  </div>

                  <div className="rounded-lg bg-paper-50 p-2">
                    <span className="text-[10px] font-bold text-ink-400 uppercase block">{t.leads.plotBuiltUp}</span>
                    <span className="font-bold text-ink-900">
                      {lead.plotArea ? `${lead.plotArea} sq.ft` : "—"} / {lead.builtUpArea ? `${lead.builtUpArea} sq.ft` : "—"}
                    </span>
                  </div>

                  <div className="rounded-lg bg-paper-50 p-2">
                    <span className="text-[10px] font-bold text-ink-400 uppercase block">{t.leads.stage}</span>
                    <span className="font-bold text-ink-900 truncate block">{lead.constructionStage || t.leads.planning}</span>
                  </div>
                </div>

                {/* Requirements note */}
                {lead.requirements && (
                  <p className="text-xs text-ink-600 bg-paper-50/50 p-2.5 rounded-xl border border-paper-100 italic">
                    &ldquo;{lead.requirements}&rdquo;
                  </p>
                )}

                {/* Actions & Contact Links */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-paper-100">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-clay-50 px-2.5 py-1.5 text-xs font-bold text-clay-800 hover:bg-clay-100 transition"
                    >
                      <Phone className="h-3 w-3" />
                      <span>{lead.phone}</span>
                    </a>

                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-paper-100 px-2 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-200 transition"
                      >
                        <Mail className="h-3 w-3" />
                        <span className="hidden sm:inline">{t.leads.email}</span>
                      </a>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-ink-400">{t.leads.statusLabel}</span>
                    <select
                      value={lead.status}
                      disabled={pending}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className="rounded-lg border border-paper-300 bg-white px-2 py-1 text-xs font-bold text-ink-800 focus:border-clay-600 focus:outline-hidden transition"
                    >
                      <option value="NEW">{t.leads.statusNew}</option>
                      <option value="CONTACTED">{t.leads.statusContacted}</option>
                      <option value="SITE_VISIT">{t.leads.statusSiteVisit}</option>
                      <option value="ESTIMATE_SENT">{t.leads.statusEstimateSent}</option>
                      <option value="NEGOTIATION">{t.leads.statusNegotiation}</option>
                      <option value="WON">{t.leads.statusWon}</option>
                      <option value="LOST">{t.leads.statusLost}</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDelete(lead.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title={t.leads.deleteConfirm}
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
        <div className="rounded-2xl border border-dashed border-paper-300 bg-white p-12 text-center space-y-3">
          <Building2 className="mx-auto h-10 w-10 text-ink-300" />
          <h3 className="font-display text-base font-bold text-ink-800">{t.leads.emptyTitle}</h3>
          <p className="text-xs text-ink-500 max-w-sm mx-auto">
            {t.leads.emptySub}
          </p>
        </div>
      )}

      <ConfirmDialog
        open={!!leadToDelete}
        onClose={() => setLeadToDelete(null)}
        onConfirm={() => {
          if (!leadToDelete) return;
          start(async () => {
            await deleteLead(leadToDelete);
            setLeads((prev) => prev.filter((l) => l.id !== leadToDelete));
            setLeadToDelete(null);
          });
        }}
        title={t.leads.deleteTitle}
        description={t.leads.deleteDesc}
        confirmText={t.leads.deleteConfirm}
        loading={pending}
      />
    </div>
  );
}
