"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ExternalLink, Pencil, X, Loader2, Building2 } from "lucide-react";
import { deleteProject, switchProject, updateProject } from "@/lib/actions/projects";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Select, TextArea, TextInput } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";

export type ProjectDetails = {
  id: string;
  name: string;
  location?: string | null;
  plotArea?: number | string | object | null;
  builtUpArea?: number | string | object | null;
  numberOfFloors?: number | null;
  totalBudget?: number | string | object | null;
  startDate?: Date | string | null;
  expectedCompletionDate?: Date | string | null;
  status?: string;
  notes?: string | null;
};

export function ProjectCardActions({
  projectId,
  projectName,
  isActive,
  project,
}: {
  projectId: string;
  projectName: string;
  isActive?: boolean;
  project?: ProjectDetails;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const handleDelete = () => {
    start(async () => {
      await deleteProject(projectId);
      setShowConfirm(false);
      router.refresh();
    });
  };

  const handleSwitch = () => {
    start(async () => {
      await switchProject(projectId);
      router.push("/dashboard");
      router.refresh();
    });
  };

  const handleSaveEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditError(null);
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    start(async () => {
      try {
        const res = await updateProject(projectId, payload);
        if ("error" in res && res.error) {
          setEditError(res.error);
          return;
        }
        setShowEditModal(false);
        router.refresh();
      } catch (err) {
        setEditError(err instanceof Error ? err.message : "Failed to update project");
      }
    });
  };

  const formatIsoDate = (d?: Date | string | null) => {
    if (!d) return "";
    if (typeof d === "string") return d.slice(0, 10);
    return d.toISOString().slice(0, 10);
  };

  return (
    <div className="mt-4 flex items-center justify-between border-t border-paper-100 pt-3 text-xs flex-wrap gap-2">
      <div className="flex items-center gap-3 font-semibold text-clay-700">
        <Link href={`/projects/${projectId}`} className="hover:underline flex items-center gap-1">
          <span>Overview</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
        <Link href={`/projects/${projectId}/stages`} className="hover:underline">Stages</Link>
        <Link href={`/projects/${projectId}/floors`} className="hover:underline">Floors</Link>
      </div>

      <div className="flex items-center gap-1.5">
        {!isActive && (
          <button
            type="button"
            onClick={handleSwitch}
            disabled={pending}
            className="rounded-lg bg-clay-50 hover:bg-clay-100 px-2.5 py-1 font-bold text-clay-800 transition cursor-pointer"
          >
            {pending ? "Switching..." : "Make Active"}
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowEditModal(true)}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg border border-paper-300 bg-white hover:bg-paper-50 px-2.5 py-1 font-bold text-ink-700 transition shadow-2xs cursor-pointer"
          title={`Edit ${projectName}`}
        >
          <Pencil className="h-3 w-3 text-clay-600" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={pending}
          className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
          title={`Delete ${projectName}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Edit House Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-ink-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => !pending && setShowEditModal(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-paper-200">
            <div className="flex items-center justify-between border-b border-paper-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-100 text-clay-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink-900 leading-tight">
                    Edit House Details
                  </h3>
                  <p className="text-xs text-ink-500 font-medium mt-0.5">
                    Update budget, area, location or construction status
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={pending}
                className="rounded-xl p-1.5 text-ink-400 hover:bg-paper-100 hover:text-ink-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700">
                {editError}
              </div>
            )}

            <form className="space-y-3.5" onSubmit={handleSaveEdit}>
              <Field label="House / Project Name">
                <TextInput name="name" required defaultValue={project?.name ?? projectName} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Location">
                  <TextInput name="location" defaultValue={project?.location ?? ""} placeholder="e.g. Whitefield, Bengaluru" />
                </Field>
                <Field label="Total Planned Budget (₹)">
                  <TextInput
                    name="totalBudget"
                    inputMode="decimal"
                    defaultValue={project?.totalBudget ? String(project.totalBudget) : ""}
                    placeholder="e.g. 4500000"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Plot Area (sq ft)">
                  <TextInput
                    name="plotArea"
                    inputMode="decimal"
                    defaultValue={project?.plotArea ? String(project.plotArea) : ""}
                    placeholder="e.g. 2400"
                  />
                </Field>
                <Field label="Built-up Area (sq ft)">
                  <TextInput
                    name="builtUpArea"
                    inputMode="decimal"
                    defaultValue={project?.builtUpArea ? String(project.builtUpArea) : ""}
                    placeholder="e.g. 3200"
                  />
                </Field>
                <Field label="Floors">
                  <TextInput
                    name="numberOfFloors"
                    inputMode="numeric"
                    defaultValue={project?.numberOfFloors ? String(project.numberOfFloors) : ""}
                    placeholder="e.g. 2"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Status">
                  <Select name="status" defaultValue={project?.status ?? "IN_PROGRESS"}>
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </Select>
                </Field>
                <Field label="Start Date">
                  <TextInput name="startDate" type="date" defaultValue={formatIsoDate(project?.startDate)} />
                </Field>
              </div>

              <Field label="Expected Completion Date">
                <TextInput name="expectedCompletionDate" type="date" defaultValue={formatIsoDate(project?.expectedCompletionDate)} />
              </Field>

              <Field label="Notes / Description">
                <TextArea name="notes" defaultValue={project?.notes ?? ""} placeholder="Additional notes, contractor contact, site landmarks..." />
              </Field>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-paper-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={pending}
                  className="rounded-xl border border-paper-300 bg-white px-4 py-2.5 text-xs font-bold text-ink-700 hover:bg-paper-50 transition"
                >
                  Cancel
                </button>
                <Button type="submit" disabled={pending} className="bg-clay-600 hover:bg-clay-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs">
                  {pending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Changes…</span>
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete House Project?"
        description={`Are you sure you want to permanently delete "${projectName}"? All related construction stages, expenses, documents, and category budgets for this project will be deleted.`}
        confirmText={pending ? "Deleting..." : "Delete Project"}
        variant="danger"
      />
    </div>
  );
}
