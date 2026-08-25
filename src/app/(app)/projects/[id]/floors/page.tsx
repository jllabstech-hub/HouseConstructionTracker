import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { getFloorTotal } from "@/lib/finance/aggregations";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { FloorManager } from "@/components/projects/structure-managers";

import { ProjectNavTabs } from "@/components/projects/project-nav-tabs";

export default async function FloorsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) notFound();
  const [floors, expenses] = await Promise.all([
    prisma.floor.findMany({ where: { projectId: id }, orderBy: { sortOrder: "asc" } }),
    loadProjectExpenses(id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={`${project.name} floors`} subtitle="Attach expenses to basement, floors, terrace or external works." />
      <ProjectNavTabs projectId={project.id} />
      <ul className="mb-4 grid gap-2 sm:grid-cols-2">
        {floors.map((floor) => (
          <li key={floor.id} className="rounded-xl bg-white px-4 py-3 text-sm">
            {floor.name}: {formatINR(getFloorTotal(expenses, floor.id))}
          </li>
        ))}
      </ul>
      <FloorManager projectId={id} floors={floors} />
    </div>
  );
}
