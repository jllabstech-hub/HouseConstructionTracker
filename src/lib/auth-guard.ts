import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const requireUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return {
    id: session.user.id,
    name: session.user.name ?? "Homeowner",
    email: session.user.email ?? null,
  };
});

export const requireProject = cache(async (projectId: string, userId?: string) => {
  const user = userId ? { id: userId } : await requireUser();
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) {
    throw new Error("Project not found or access denied");
  }
  return project;
});

export async function getOwnedProjectOrNull(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
  });
}
