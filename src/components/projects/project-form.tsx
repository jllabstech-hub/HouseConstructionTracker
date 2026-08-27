"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject, updateProject, deleteProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/fields";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Trash2 } from "lucide-react";

export function ProjectForm({
  projectId,
  initial,
}: {
  projectId?: string;
  initial?: Record<string, string>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (!projectId) return;
    start(async () => {
      const res = await deleteProject(projectId);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setShowDeleteConfirm(false);
      router.push("/projects");
      router.refresh();
    });
  };

  return (
    <>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
          start(async () => {
            const result = projectId ? await updateProject(projectId, payload) : await createProject(payload);
            if ("error" in result && result.error) {
              setError(result.error);
              return;
            }
            router.push("/projects");
            router.refresh();
          });
        }}
      >
        <Field label="Project name">
          <TextInput name="name" required defaultValue={initial?.name} />
        </Field>
        <Field label="Location">
          <TextInput name="location" defaultValue={initial?.location} />
        </Field>
        <Field label="Plot area (sq ft)">
          <TextInput name="plotArea" inputMode="decimal" defaultValue={initial?.plotArea} />
        </Field>
        <Field label="Built-up area (sq ft)">
          <TextInput name="builtUpArea" inputMode="decimal" defaultValue={initial?.builtUpArea} />
        </Field>
        <Field label="Number of floors">
          <TextInput name="numberOfFloors" inputMode="numeric" defaultValue={initial?.numberOfFloors} />
        </Field>
        <Field label="Total budget">
          <TextInput name="totalBudget" inputMode="decimal" defaultValue={initial?.totalBudget} />
        </Field>
        <Field label="Start date">
          <TextInput name="startDate" type="date" defaultValue={initial?.startDate} />
        </Field>
        <Field label="Expected completion">
          <TextInput name="expectedCompletionDate" type="date" defaultValue={initial?.expectedCompletionDate} />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={initial?.status ?? "PLANNING"}>
            {["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"].map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <TextArea name="notes" defaultValue={initial?.notes} />
          </Field>
        </div>
        {error ? <p className="text-sm text-red-700 sm:col-span-2 font-semibold">{error}</p> : null}
        
        <div className="sm:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Button type="submit" disabled={pending} className="w-full sm:w-auto bg-clay-600 hover:bg-clay-700">
            {pending ? "Saving…" : projectId ? "Save project changes" : "Create project"}
          </Button>

          {projectId && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete House Project</span>
            </button>
          )}
        </div>
      </form>

      {projectId && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Delete House Project?"
          description={`Are you sure you want to permanently delete this house project? All expenses, stages, documents, floors, and budgets will be permanently deleted.`}
          confirmText={pending ? "Deleting..." : "Delete Permanently"}
          variant="danger"
        />
      )}
    </>
  );
}
