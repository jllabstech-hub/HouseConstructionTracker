import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const user = await requireUser();
  const projectCount = await prisma.project.count({ where: { userId: user.id } });
  const expenseCount = await prisma.expense.count({
    where: { project: { userId: user.id } },
  });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account and workspace details." />
      <Card>
        <CardTitle>Profile</CardTitle>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Name</dt><dd>{user.name}</dd></div>
          <div className="flex justify-between"><dt>Email</dt><dd>{user.email}</dd></div>
          <div className="flex justify-between"><dt>Projects</dt><dd>{projectCount}</dd></div>
          <div className="flex justify-between"><dt>Expenses</dt><dd>{expenseCount}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-ink-600">
          Receipts are stored privately and served only to the owning user. OCR fields exist on each receipt for a later extraction job.
        </p>
      </Card>
    </div>
  );
}
