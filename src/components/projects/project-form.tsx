"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject, updateProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/fields";

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

  return (
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
      {error ? <p className="text-sm text-red-700 sm:col-span-2">{error}</p> : null}
      <Button type="submit" disabled={pending} className="sm:col-span-2">
        {pending ? "Saving…" : "Save project"}
      </Button>
    </form>
  );
}
