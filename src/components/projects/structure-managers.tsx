"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFloor, createStage, deleteFloor, updateStage } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Field, Select, TextInput } from "@/components/ui/fields";

export function FloorManager({
  projectId,
  floors,
}: {
  projectId: string;
  floors: { id: string; name: string; notes: string | null }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

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
        <TextInput name="name" placeholder="Floor name" required />
        <Button type="submit" disabled={pending}>Add floor</Button>
      </form>
      <ul className="divide-y divide-paper-200 rounded-2xl bg-white">
        {floors.map((floor) => (
          <li key={floor.id} className="flex items-center justify-between px-4 py-3">
            <span>{floor.name}</span>
            <button
              type="button"
              className="text-sm text-red-700"
              onClick={() => start(async () => {
                await deleteFloor(projectId, floor.id);
                router.refresh();
              })}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
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

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-4"
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
        <Button type="submit" disabled={pending}>Add stage</Button>
      </form>

      <div className="space-y-3">
        {stages.map((stage) => (
          <form
            key={stage.id}
            className="grid gap-2 rounded-2xl bg-white p-4 md:grid-cols-[1.4fr_1fr_90px_auto]"
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
            <Button type="submit" disabled={pending} className="self-end">Save</Button>
          </form>
        ))}
      </div>
    </div>
  );
}
