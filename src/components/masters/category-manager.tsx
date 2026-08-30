"use client";

import { useMemo, useState, useTransition } from "react";
import { Edit3, Plus, Search, Trash2, X } from "lucide-react";
import {
  createLabourCategory,
  createMaterialCategory,
  deleteLabourCategory,
  deleteMaterialCategory,
  updateLabourCategory,
  updateMaterialCategory,
} from "@/lib/actions/masters";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Category = { id: string; name: string; groupName: string | null };
type Kind = "material" | "labour";

export function CategoryManager({ projectId, materials, labours }: { projectId: string; materials: Category[]; labours: Category[] }) {
  const [kind, setKind] = useState<Kind>("material");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const list = kind === "material" ? materials : labours;
  const filtered = useMemo(() => list.filter((item) => `${item.name} ${item.groupName ?? ""}`.toLowerCase().includes(query.toLowerCase())), [list, query]);
  const reset = () => { setName(""); setGroupName(""); setEditing(null); setError(null); };
  const save = () => start(async () => {
    const input = { projectId, name, groupName };
    const result = editing
      ? kind === "material" ? await updateMaterialCategory(editing.id, input) : await updateLabourCategory(editing.id, input)
      : kind === "material" ? await createMaterialCategory(input) : await createLabourCategory(input);
    if ("error" in result && result.error) return setError(result.error);
    reset();
    window.location.reload();
  });

  return <div className="w-full space-y-5 pb-8">
    <header className="flex flex-col gap-2 border-b border-paper-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="font-display text-2xl font-bold text-ink-900">Categories</h1><p className="mt-1 text-sm text-ink-600">Create only the materials and labour types you use. They become available in expense entry immediately.</p></div>
      <div className="flex rounded-xl border border-paper-300 bg-white p-1 text-xs font-bold">
        {(["material", "labour"] as Kind[]).map((value) => <button key={value} type="button" onClick={() => { setKind(value); reset(); }} className={`rounded-lg px-3 py-2 capitalize ${kind === value ? "bg-clay-600 text-white" : "text-ink-600"}`}>{value}</button>)}
      </div>
    </header>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-2xl border border-paper-200 bg-white p-4 sm:p-5">
        <label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${kind} categories`} className="w-full rounded-xl border border-paper-300 py-2.5 pl-9 pr-3 text-sm focus:border-clay-500 focus:outline-none" /></label>
        <div className="mt-4 divide-y divide-paper-100">
          {filtered.length ? filtered.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink-900">{item.name}</p>{item.groupName && <p className="text-xs text-ink-500">{item.groupName}</p>}</div><div className="flex shrink-0 gap-1"><button type="button" aria-label={`Edit ${item.name}`} onClick={() => { setEditing(item); setName(item.name); setGroupName(item.groupName ?? ""); setError(null); }} className="rounded-lg p-2 text-ink-500 hover:bg-paper-100"><Edit3 className="h-4 w-4" /></button><button type="button" aria-label={`Delete ${item.name}`} onClick={() => setDeleting(item)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></div>) : <p className="py-10 text-center text-sm text-ink-500">No {kind} categories yet. Add your first one.</p>}
        </div>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); save(); }} className="h-fit rounded-2xl border border-paper-200 bg-white p-4 sm:p-5 xl:sticky xl:top-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-bold text-ink-900">{editing ? "Edit category" : `Add ${kind} category`}</h2>{editing && <button type="button" onClick={reset} className="rounded-lg p-1 text-ink-500"><X className="h-4 w-4" /></button>}</div>
        <label className="mb-3 block text-xs font-bold text-ink-700">Name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder={kind === "material" ? "e.g. Cement" : "e.g. Masonry"} className="mt-1.5 w-full rounded-xl border border-paper-300 px-3 py-2.5 text-sm focus:border-clay-500 focus:outline-none" /></label>
        <label className="mb-4 block text-xs font-bold text-ink-700">Group <span className="font-normal text-ink-400">(optional)</span><input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="e.g. Structure" className="mt-1.5 w-full rounded-xl border border-paper-300 px-3 py-2.5 text-sm focus:border-clay-500 focus:outline-none" /></label>
        {error && <p className="mb-3 text-xs font-semibold text-red-700">{error}</p>}<button disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-clay-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Plus className="h-4 w-4" />{pending ? "Saving…" : editing ? "Save changes" : "Add category"}</button>
      </form>
    </section>
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => { if (!deleting) return; start(async () => { const result = kind === "material" ? await deleteMaterialCategory(deleting.id) : await deleteLabourCategory(deleting.id); if ("error" in result && result.error) setError(result.error); else window.location.reload(); setDeleting(null); }); }} title="Delete category?" description={`Existing expenses will keep their amounts but no longer be linked to “${deleting?.name ?? ""}”.`} confirmText={pending ? "Deleting…" : "Delete"} variant="danger" />
  </div>;
}
