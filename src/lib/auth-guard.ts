import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}

export async function requireProject(projectId: string, userId?: string) {
  const user = userId ? { id: userId } : await requireUser();
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) {
    throw new Error("Project not found or access denied");
  }
  return project;
}

export async function getOwnedProjectOrNull(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
  });
}
