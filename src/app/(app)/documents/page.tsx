import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import { getCached, setCached } from "@/lib/cache-utils";
import { EmptyState } from "@/components/ui/page-header";
import { NoProjectState } from "@/components/projects/no-project-state";
import { DocumentsHub, type DocumentItem } from "@/components/documents/documents-hub";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  if (!projectId) {
    return (
      <NoProjectState
        title="No House Project Selected"
        description="Please create or select a house project to manage blueprints, structural drawings, and floor plans."
      />
    );
  }

  const cacheKey = `documents:${projectId}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cached = getCached<any>(cacheKey);

  if (cached) {
    return (
      <DocumentsHub
        projectId={cached.projectId}
        projectName={cached.projectName}
        documents={cached.documents}
        floors={cached.floors}
        stages={cached.stages}
      />
    );
  }

  try {
    const [project, rawDocuments, floors, stages] = await Promise.all([
      prisma.project.findFirst({ where: { id: projectId, userId: user.id } }),
      prisma.projectDocument.findMany({
        where: { projectId },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      }),
      prisma.floor.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
      prisma.constructionStage.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
    ]);

    if (!project) {
      return <EmptyState title="No project found" body="Create or select a house project to manage blueprints and elevations." />;
    }

    const documents: DocumentItem[] = rawDocuments.map((d) => ({
      id: d.id,
      projectId: d.projectId,
      category: d.category as DocumentItem["category"],
      title: d.title,
      description: d.description,
      floorId: d.floorId,
      constructionStageId: d.constructionStageId,
      fileName: d.fileName,
      storedName: d.storedName,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      storagePath: d.storagePath,
      version: d.version,
      isPinned: d.isPinned,
      createdAt: d.createdAt.toISOString(),
    }));

    const payload = {
      projectId: project.id,
      projectName: project.name,
      documents,
      floors: floors.map((f) => ({ id: f.id, name: f.name })),
      stages: stages.map((s) => ({ id: s.id, name: s.name })),
    };

    setCached(cacheKey, payload);

    return (
      <DocumentsHub
        projectId={payload.projectId}
        projectName={payload.projectName}
        documents={payload.documents}
        floors={payload.floors}
        stages={payload.stages}
      />
    );
  } catch (err) {
    console.error("DocumentsPage load error:", err);
    return (
      <EmptyState
        title="Documents"
        body="Unable to load documents at this moment. Please refresh."
      />
    );
  }
}

