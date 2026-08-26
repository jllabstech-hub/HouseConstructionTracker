import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const sessionUserId = session.user.id;
  const sessionEmail = session.user.email;

  // 1. Try finding user by ID
  let dbUser = sessionUserId
    ? await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { id: true, name: true, email: true },
      })
    : null;

  // 2. If ID mismatch (e.g. database recreated/reseeded with new IDs or stale JWT cookie), resolve by email
  if (!dbUser && sessionEmail) {
    const lower = sessionEmail.toLowerCase().trim();
    dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: sessionEmail },
          { email: lower },
          ...(lower === "admin"
            ? [
                { email: "admin" },
                { email: "admin@housetracker.app" },
                { email: "demo@housetracker.app" },
              ]
            : []),
        ],
      },
      select: { id: true, name: true, email: true },
    });
  }

  if (!dbUser) {
    redirect("/login");
  }

  return dbUser;
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
