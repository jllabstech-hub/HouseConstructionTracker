"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFloor, createStage, deleteFloor, deleteStage, updateStage } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Field, Select, TextInput } from "@/components/ui/fields";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Trash2 } from "lucide-react";

export function FloorManager({
  projectId,
  floors,
}: {
  projectId: string;
  floors: { id: string; name: string; notes: string | null }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    start(async () => {
      await deleteFloor(projectId, deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          const formElement = event.currentTarget;
          const form = new FormData(formElement);
          start(async () => {
            await createFloor(projectId, { name: String(form.get("name")), notes: String(form.get("notes") ?? "") });
            formElement.reset();
            router.refresh();
          });
        }}
      >
        <TextInput name="name" placeholder="Floor name (e.g. Ground Floor, 1st Floor)" required />
        <Button type="submit" disabled={pending} className="bg-clay-600 hover:bg-clay-700">Add floor</Button>
      </form>
      <ul className="divide-y divide-paper-200 rounded-2xl bg-white border border-paper-200 shadow-xs">
        {floors.map((floor) => (
          <li key={floor.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-semibold text-ink-900">{floor.name}</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition"
              onClick={() => setDeleteTarget({ id: floor.id, name: floor.name })}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove</span>
            </button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Floor?"
        description={`Are you sure you want to remove "${deleteTarget?.name}"?`}
        confirmText={pending ? "Removing..." : "Remove Floor"}
        variant="danger"
      />
    </div>
  );
}

export function StageManager({
  projectId,
  stages,
}: {
  projectId: string;
  stages: {
    id: string;
    name: string;
    status: string;
    percentageComplete: number;
    notes: string | null;
  }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    start(async () => {
      await deleteStage(projectId, deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-4 border border-paper-200 shadow-xs"
        onSubmit={(event) => {
          event.preventDefault();
          const formElement = event.currentTarget;
          const form = new FormData(formElement);
          start(async () => {
            await createStage(projectId, {
              name: String(form.get("name")),
              status: String(form.get("status")),
              percentageComplete: Number(form.get("percentageComplete") ?? 0),
              notes: String(form.get("notes") ?? ""),
            });
            formElement.reset();
            router.refresh();
          });
        }}
      >
        <TextInput name="name" placeholder="Stage name" required />
        <Select name="status" defaultValue="NOT_STARTED">
          {["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"].map((status) => (
            <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
          ))}
        </Select>
        <TextInput name="percentageComplete" type="number" min={0} max={100} defaultValue="0" />
        <Button type="submit" disabled={pending} className="bg-clay-600 hover:bg-clay-700">Add stage</Button>
      </form>

      <div className="space-y-3">
        {stages.map((stage) => (
          <form
            key={stage.id}
            className="grid gap-2 rounded-2xl bg-white p-4 md:grid-cols-[1.4fr_1fr_90px_auto_auto] items-end border border-paper-200 shadow-xs"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              start(async () => {
                await updateStage(projectId, stage.id, {
                  name: String(form.get("name")),
                  status: String(form.get("status")),
                  percentageComplete: Number(form.get("percentageComplete") ?? 0),
                  notes: String(form.get("notes") ?? ""),
                });
                router.refresh();
              });
            }}
          >
            <Field label="Name"><TextInput name="name" defaultValue={stage.name} /></Field>
            <Field label="Status">
              <Select name="status" defaultValue={stage.status}>
                {["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"].map((status) => (
                  <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                ))}
              </Select>
            </Field>
            <Field label="%">
              <TextInput name="percentageComplete" type="number" min={0} max={100} defaultValue={String(stage.percentageComplete)} />
            </Field>
            <Button type="submit" disabled={pending} className="self-end bg-clay-600 hover:bg-clay-700">Save</Button>
            <button
              type="button"
              onClick={() => setDeleteTarget({ id: stage.id, name: stage.name })}
              disabled={pending}
              className="self-end p-2 text-ink-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
              title="Delete Stage"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Construction Stage?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmText={pending ? "Deleting..." : "Delete Stage"}
        variant="danger"
      />
    </div>
  );
}
