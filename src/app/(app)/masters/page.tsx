import { getActiveProjectId } from "@/lib/project-context";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/masters/category-manager";

export default async function MastersPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  if (!projectId) return <p className="py-12 text-center text-sm text-ink-600">Create a house project before adding categories.</p>;
  const [materials, labours, stages] = await Promise.all([
    prisma.materialCategory.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
    prisma.labourCategory.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
    prisma.constructionStage.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
  ]);
  return <CategoryManager projectId={projectId} materials={materials} labours={labours} stages={stages} />;
}
