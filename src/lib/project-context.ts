import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const PROJECT_COOKIE = "hct-project-id";

export async function getActiveProjectId(userId: string): Promise<string | null> {
  const jar = await cookies();
  const cookieId = jar.get(PROJECT_COOKIE)?.value;
  if (cookieId) {
    const owned = await prisma.project.findFirst({
      where: { id: cookieId, userId },
      select: { id: true },
    });
    if (owned) return owned.id;
  }

  const first = await prisma.project.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return first?.id ?? null;
}

export async function setActiveProjectId(projectId: string) {
  const jar = await cookies();
  jar.set(PROJECT_COOKIE, projectId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
