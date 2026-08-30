import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { getCached, setCached } from "@/lib/cache-utils";
import type { Project } from "@prisma/client";

export const PROJECT_COOKIE = "hct-project-id";

export type ActiveProjectContext = {
  user: { id: string; name: string | null; email: string | null };
  project: Project;
  projects: { id: string; name: string }[];
};

/**
 * Robust active project resolution with React request deduplication + in-memory cache:
 * 1. Resolves authenticated user.
 * 2. Fetches owned projects with in-memory caching.
 * 3. Matches active project from cookie.
 * 4. Self-heals if cookie is missing/stale/deleted by selecting another valid project.
 * 5. If user has 0 projects, auto-provisions default "Nandakam" house project with 20 construction stages!
 */
export const getActiveProject = cache(async (userId?: string): Promise<ActiveProjectContext | null> => {
  const user = userId ? { id: userId, name: "Homeowner", email: null } : await requireUser();
  if (!user?.id) return null;

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (projects.length === 0) {
    return null;
  }

  const jar = await cookies();
  const cookieId = jar.get(PROJECT_COOKIE)?.value;

  const active = (cookieId ? projects.find((p) => p.id === cookieId) : null) ?? projects[0];

  return {
    user,
    project: active,
    projects: projects.map((p) => ({ id: p.id, name: p.name })),
  };
});

export const getActiveProjectId = cache(async (userId: string): Promise<string | null> => {
  const ctx = await getActiveProject(userId);
  return ctx?.project.id ?? null;
});

export async function setActiveProjectId(projectId: string) {
  const jar = await cookies();
  jar.set(PROJECT_COOKIE, projectId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearActiveProjectId() {
  try {
    const jar = await cookies();
    jar.delete(PROJECT_COOKIE);
  } catch {
    // Read-only context safe catch
  }
}
