"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  createVendor,
  createWorker,
  updateVendor,
  updateWorker,
  deleteVendor,
  deleteWorker,
  clearAllPhoneDirectory,
} from "@/lib/actions/masters";
import { formatINR } from "@/lib/money";
import { getVendorTotal, getWorkerTotal, type ExpenseRecord } from "@/lib/finance/aggregations";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  Search,
  Phone,
  PhoneCall,
  MessageCircle,
  User,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  X,
  IndianRupee,
  Users,
} from "lucide-react";
import { UpiPayModal, type PayRecipient } from "@/components/masters/upi-pay-modal";

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

export type ContactItem = {
  id: string;
  name: string;
  kind: "worker" | "vendor";
  role: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  workerType?: string;
};

const COMMON_ROLES = [
  "Mason (Mistri)",
  "Labour Contractor",
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "Tile & Marble Worker",
  "Welder / Fabricator",
  "General Labour (Mazdoor)",
  "Cement & Steel Dealer",
  "Sand & Bricks Supplier",
  "Hardware & Tools Store",
  "Architect / Engineer",
  "Site Supervisor",
  "Other",
];

const WORKER_TYPE_MAP: Record<string, string> = {
  "Mason (Mistri)": "MASON",
  "Labour Contractor": "CONTRACTOR",
  "Electrician": "ELECTRICIAN",
  "Plumber": "PLUMBER",
  "Carpenter": "CARPENTER",
  "Painter": "PAINTER",
  "Tile & Marble Worker": "TILE_WORKER",
  "Welder / Fabricator": "FABRICATOR",
  "General Labour (Mazdoor)": "GENERAL_LABOUR",
};

export function MasterForms({
  vendors = [],
  workers = [],
  expenses = [],
}: {
  projectId?: string;
  materials?: unknown[];
  labours?: unknown[];
  vendors?: VendorItem[];
  workers?: WorkerItem[];
  services?: unknown[];
  expenses?: ExpenseRecord[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [formRole, setFormRole] = useState<string>("Mason (Mistri)");
  const [customRole, setCustomRole] = useState<string>("");

  // Delete / Clear / Pay Dialogs
  const [deleteTarget, setDeleteTarget] = useState<ContactItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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

  // Effective combined contacts list
  const allContacts: ContactItem[] = useMemo(() => {
    const effectiveWorkers = workers.filter((w) => !deletedIds.has(w.id));
    const effectiveVendors = vendors.filter((v) => !deletedIds.has(v.id));

    const workerContacts: ContactItem[] = effectiveWorkers.map((w) => ({
      id: w.id,
      name: w.name,
      kind: "worker",
      role: w.specialization || w.type.replaceAll("_", " "),
      phone: w.phone,
      address: null,
      notes: w.notes,
      workerType: w.type,
    }));

    const vendorContacts: ContactItem[] = effectiveVendors.map((v) => ({
      id: v.id,
      name: v.name,
      kind: "vendor",
      role: v.company || "Supplier / Store",
      phone: v.phone,
      address: v.address,
      notes: v.notes,
    }));

    return [...workerContacts, ...vendorContacts].sort((a, b) => a.name.localeCompare(b.name));
  }, [workers, vendors, deletedIds]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return allContacts.filter((c) => {
      if (selectedRoleFilter !== "ALL") {
        const matchesRole = c.role.toLowerCase().includes(selectedRoleFilter.toLowerCase());
        if (!matchesRole) return false;
      }
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    });
  }, [allContacts, selectedRoleFilter, search]);

  const paginatedContacts = filteredContacts.slice((page - 1) * pageSize, page * pageSize);

  const startEdit = (contact: ContactItem) => {
    setEditingContact(contact);
    if (COMMON_ROLES.includes(contact.role)) {
      setFormRole(contact.role);
      setCustomRole("");
    } else {
      setFormRole("Other");
      setCustomRole(contact.role);
    }
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setEditingContact(null);
    setShowAddForm(false);
    setFormRole("Mason (Mistri)");
    setCustomRole("");
  };

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-200/80 pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
            Phone Directory
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            Store and call all your house construction contacts, contractors, masons, and suppliers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {allContacts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 hover:bg-red-100 px-3 py-2 text-xs font-bold text-red-700 shadow-2xs transition active:scale-95 cursor-pointer"
              title="Clear all contacts"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
              <span>Clear All Contacts ({allContacts.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (showAddForm && !editingContact) {
                setShowAddForm(false);
              } else {
                setEditingContact(null);
                setFormRole("Mason (Mistri)");
                setCustomRole("");
                setShowAddForm(true);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-clay-700 transition cursor-pointer"
          >
            {showAddForm && !editingContact ? (
              <>
                <X className="h-4 w-4" />
                <span>Close Form</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add Contact</span>
              </>
            )}
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

      {/* Main Grid: Contacts List & Add/Edit Form */}
      <div className="grid gap-6 lg:grid-cols-3 items-start min-w-0 max-w-full">
        {/* Contact List & Search */}
        <div className={cn("space-y-4 min-w-0 max-w-full", showAddForm ? "lg:col-span-2" : "lg:col-span-3")}>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search contacts by name, role, trade, or mobile number..."
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
                Showing {filteredContacts.length} of {allContacts.length} contacts
              </p>
            </div>
          </div>

          {/* Quick Role Filters */}
          <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1">
            <button
              type="button"
              onClick={() => {
                setSelectedRoleFilter("ALL");
                setPage(1);
              }}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 border",
                selectedRoleFilter === "ALL"
                  ? "bg-clay-600 text-white border-clay-600 shadow-xs"
                  : "bg-white text-ink-700 border-paper-200 hover:bg-paper-50"
              )}
            >
              All Contacts ({allContacts.length})
            </button>
            {["Mason", "Contractor", "Electrician", "Plumber", "Carpenter", "Painter", "Dealer", "Supplier", "Store"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setSelectedRoleFilter(role);
                  setPage(1);
                }}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 border",
                  selectedRoleFilter === role
                    ? "bg-clay-600 text-white border-clay-600 shadow-xs"
                    : "bg-white text-ink-700 border-paper-200 hover:bg-paper-50"
                )}
              >
                {role}
              </button>
            ))}
          </div>

          {filteredContacts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-paper-300 bg-white p-10 text-center space-y-3">
              <Users className="h-10 w-10 text-ink-300 mx-auto" />
              <h3 className="font-bold text-ink-900 text-sm sm:text-base">
                No contacts found
              </h3>
              <p className="text-xs text-ink-500 max-w-sm mx-auto">
                {allContacts.length === 0
                  ? "Your phone directory is empty. Add your contractors, masons, electricians, and material suppliers to call or pay them in one click."
                  : "No contacts match your current search criteria."}
              </p>
              {allContacts.length === 0 && !showAddForm && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-clay-700 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add First Contact</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={cn("grid gap-4", showAddForm ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
              {paginatedContacts.map((contact) => {
                const totalSpent = Number(
                  contact.kind === "vendor"
                    ? getVendorTotal(expenses, contact.id)
                    : getWorkerTotal(expenses, contact.id)
                );

                const waLink = getWaLink(contact.phone);
                const telPhone = cleanPhone(contact.phone);

                return (
                  <div
                    key={`${contact.kind}-${contact.id}`}
                    className="rounded-3xl border border-paper-200 bg-white p-5 shadow-xs hover:border-clay-300 transition space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-clay-100 text-clay-700 font-bold text-sm">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-ink-900 text-sm truncate leading-tight">
                              {contact.name}
                            </h3>
                            <span className="inline-block rounded-md bg-paper-100 px-2 py-0.5 text-[10px] font-bold text-ink-600 mt-1 truncate max-w-[180px]">
                              {contact.role}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(contact)}
                            className="rounded-lg p-1.5 text-ink-400 hover:bg-paper-100 hover:text-ink-900 transition"
                            title="Edit Contact"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(contact)}
                            className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Delete Contact"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {contact.phone && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-ink-700">
                          <Phone className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                          <span>{contact.phone}</span>
                        </div>
                      )}

                      {contact.address && (
                        <div className="mt-1 flex items-start gap-1.5 text-[11px] text-ink-500">
                          <MapPin className="h-3.5 w-3.5 text-ink-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{contact.address}</span>
                        </div>
                      )}

                      {contact.notes && (
                        <div className="mt-1.5 rounded-xl bg-paper-50 p-2 text-[11px] text-ink-600 line-clamp-2 border border-paper-100">
                          {contact.notes}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-paper-100 space-y-2.5">
                      {totalSpent > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-500 font-medium">Total Paid</span>
                          <span className="font-bold text-clay-700">{formatINR(totalSpent)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        {telPhone ? (
                          <a
                            href={`tel:${telPhone}`}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-2 text-xs font-bold text-emerald-800 transition"
                            title="Call Phone"
                          >
                            <PhoneCall className="h-3.5 w-3.5 text-emerald-700" />
                            <span>Call</span>
                          </a>
                        ) : null}

                        {waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-2 py-2 text-xs font-bold text-white shadow-2xs transition"
                            title="Open WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => {
                            setPayRecipient({
                              id: contact.id,
                              name: contact.name,
                              phone: contact.phone,
                              type: contact.kind === "vendor" ? "VENDOR" : "WORKER",
                              notes: contact.notes,
                            });
                            setShowPayModal(true);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-2 text-xs font-bold text-purple-800 transition"
                          title="Pay via UPI"
                        >
                          <IndianRupee className="h-3.5 w-3.5 text-purple-700" />
                          <span>Pay UPI</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredContacts.length > pageSize && (
            <TablePagination
              currentPage={page}
              totalItems={filteredContacts.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[6, 8, 12, 24]}
            />
          )}
        </div>

        {/* Add / Edit Contact Form */}
        {showAddForm && (
          <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4 lg:sticky lg:top-6 min-w-0 max-w-full animate-fadeIn">
            <div className="flex items-center justify-between gap-2 border-b border-paper-100 pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-clay-600" />
                <h3 className="font-display font-bold text-ink-900 text-base">
                  {editingContact ? "Edit Contact" : "Add New Contact"}
                </h3>
              </div>
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-full p-1 text-ink-400 hover:bg-paper-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              key={editingContact ? `${editingContact.kind}-${editingContact.id}` : "new-contact"}
              className="space-y-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                const formElement = e.currentTarget;
                const form = new FormData(formElement);
                const name = form.get("name") as string;
                const phone = form.get("phone") as string;
                const address = form.get("address") as string;
                const notes = form.get("notes") as string;

                const effectiveRole = formRole === "Other" && customRole.trim() ? customRole.trim() : formRole;
                const workerType = WORKER_TYPE_MAP[formRole] ?? "OTHER";

                start(async () => {
                  if (editingContact) {
                    if (editingContact.kind === "worker") {
                      await updateWorker(editingContact.id, {
                        name,
                        phone,
                        type: workerType,
                        specialization: effectiveRole,
                        notes,
                      });
                    } else {
                      await updateVendor(editingContact.id, {
                        name,
                        phone,
                        company: effectiveRole,
                        address,
                        notes,
                      });
                    }
                    cancelForm();
                  } else {
                    // Create new contact
                    // If it's a store/supplier, save as vendor, else worker
                    const isStore =
                      effectiveRole.toLowerCase().includes("dealer") ||
                      effectiveRole.toLowerCase().includes("supplier") ||
                      effectiveRole.toLowerCase().includes("store") ||
                      effectiveRole.toLowerCase().includes("shop");

                    if (isStore) {
                      await createVendor({
                        name,
                        company: effectiveRole,
                        phone,
                        address,
                        notes,
                      });
                    } else {
                      await createWorker({
                        name,
                        type: workerType,
                        specialization: effectiveRole,
                        phone,
                        notes,
                      });
                    }
                    formElement.reset();
                    cancelForm();
                  }
                  router.refresh();
                });
              }}
            >
              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingContact?.name ?? ""}
                  placeholder="e.g. Ramesh Mason, Balaji Hardware, Suresh Contractor"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  Role / Trade / Business
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none cursor-pointer"
                >
                  {COMMON_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                {formRole === "Other" && (
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Type custom role / trade (e.g. Borewell Operator)"
                    className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none mt-2"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={editingContact?.phone ?? ""}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  Address / Location (Optional)
                </label>
                <input
                  type="text"
                  name="address"
                  defaultValue={editingContact?.address ?? ""}
                  placeholder="e.g. Near Site, Main Road, Local Town"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-800 mb-1">
                  Notes / UPI ID / Khata (Optional)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingContact?.notes ?? ""}
                  placeholder="e.g. ramesh@upi, daily wage Rs 900, trusted contractor"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelForm}
                  className="w-1/3 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-clay-600 hover:bg-clay-700 font-bold text-white text-xs py-2.5 rounded-xl shadow-sm cursor-pointer"
                >
                  {pending ? "Saving..." : editingContact ? "Update Contact" : "Save Contact"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Delete Contact Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const target = deleteTarget;
          setDeletedIds((prev) => new Set(prev).add(target.id));
          setDeleteTarget(null);

          try {
            if (target.kind === "worker") {
              await deleteWorker(target.id);
            } else {
              await deleteVendor(target.id);
            }
            router.refresh();
          } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "Failed to delete contact");
          }
        }}
        title="Delete Contact?"
        description={`Are you sure you want to delete "${deleteTarget?.name}" from your phone directory?`}
        confirmText="Delete Contact"
        variant="danger"
      />

      {/* Clear All Contacts Confirmation Dialog */}
      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await clearAllPhoneDirectory();
            setDeletedIds(new Set(allContacts.map((c) => c.id)));
            setShowClearConfirm(false);
            router.refresh();
          } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "Failed to clear phone directory");
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Clear All Contacts?"
        description={`Are you sure you want to delete all ${allContacts.length} contacts from your phone directory? This action cannot be undone.`}
        confirmText={`Clear All (${allContacts.length})`}
        loading={isDeleting}
        variant="danger"
      />

      <UpiPayModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        recipient={payRecipient}
      />
    </div>
  );
}
