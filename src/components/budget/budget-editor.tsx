"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCategoryBudget, saveTypeBudget, updateProjectBudget } from "@/lib/actions/budget";
import { Button } from "@/components/ui/button";
import { Field, Select, TextInput } from "@/components/ui/fields";
import { Card, CardTitle } from "@/components/ui/card";

export function BudgetEditor({
  projectId,
  currentTotal,
  materials,
  labours,
}: {
  projectId: string;
  currentTotal: string;
  materials: { id: string; name: string }[];
  labours: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardTitle>Overall project budget</CardTitle>
        <form
          className="mt-3 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            start(async () => {
              await updateProjectBudget(projectId, String(form.get("amount")));
              router.refresh();
            });
          }}
        >
          <Field label="Amount">
            <TextInput name="amount" defaultValue={currentTotal} />
          </Field>
          <Button type="submit" disabled={pending}>Save</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Expense-type budget</CardTitle>
        <form
          className="mt-3 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            start(async () => {
              await saveTypeBudget(projectId, Object.fromEntries(form.entries()));
              router.refresh();
            });
          }}
        >
          <Field label="Type">
            <Select name="expenseType" defaultValue="MATERIAL">
              {["MATERIAL", "LABOUR", "SERVICE", "EQUIPMENT", "PROFESSIONAL", "OTHER"].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </Field>
          <Field label="Amount"><TextInput name="amount" required /></Field>
          <Button type="submit" disabled={pending}>Save</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Category budget</CardTitle>
        <form
          className="mt-3 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const formElement = event.currentTarget;
            const form = new FormData(formElement);
            start(async () => {
              await saveCategoryBudget(projectId, Object.fromEntries(form.entries()));
              formElement.reset();
              router.refresh();
            });
          }}
        >
          <Field label="Type">
            <Select name="expenseType" defaultValue="MATERIAL">
              <option value="MATERIAL">Material</option>
              <option value="LABOUR">Labour</option>
            </Select>
          </Field>
          <Field label="Category">
            <Select name="categoryId">
              <optgroup label="Material">
                {materials.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </optgroup>
              <optgroup label="Labour">
                {labours.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </optgroup>
            </Select>
          </Field>
          <Field label="Amount"><TextInput name="amount" required /></Field>
          <Button type="submit" disabled={pending}>Save</Button>
        </form>
      </Card>
    </div>
  );
}
