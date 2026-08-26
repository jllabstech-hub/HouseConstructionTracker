import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { seedProjectStructure } from "@/lib/catalog/seed-masters";
import type { Project } from "@prisma/client";

export const PROJECT_COOKIE = "hct-project-id";

export type ActiveProjectContext = {
  user: { id: string; name: string | null; email: string | null };
  project: Project;
  projects: { id: string; name: string }[];
};

/**
 * Robust active project resolution:
 * 1. Resolves authenticated user.
 * 2. Fetches all owned projects.
 * 3. Matches active project from cookie.
 * 4. Self-heals if cookie is missing/stale/deleted by selecting another valid project.
 * 5. If user has 0 projects, auto-provisions default "Nandakam" house project with 20 construction stages!
 */
export async function getActiveProject(userId?: string): Promise<ActiveProjectContext | null> {
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      })
    : await requireUser();

  if (!user) return null;

  let projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (projects.length === 0) {
    try {
      const newProject = await prisma.project.create({
        data: {
          userId: user.id,
          name: "Nandakam",
          location: "Pruthvi Layout, Channasandra",
          builtUpArea: 3200,
          plotArea: 2400,
          totalBudget: 4000000,
          status: "IN_PROGRESS",
          startDate: new Date("2026-01-10"),
        },
      });
      await seedProjectStructure(newProject.id, { demoProgress: true });
      projects = [newProject];
    } catch (healErr) {
      console.warn("Auto-create project failed:", healErr);
      await clearActiveProjectId();
      return null;
    }
  }

  const jar = await cookies();
  const cookieId = jar.get(PROJECT_COOKIE)?.value;

  const active = (cookieId ? projects.find((p) => p.id === cookieId) : null) ?? projects[0];

  // If cookie was missing or stale, persist the valid project ID
  if (cookieId !== active.id) {
    try {
      jar.set(PROJECT_COOKIE, active.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    } catch {
      // Cookies might be read-only in certain Next.js RSC render contexts
    }
  }

  return {
    user,
    project: active,
    projects: projects.map((p) => ({ id: p.id, name: p.name })),
  };
}

export async function getActiveProjectId(userId: string): Promise<string | null> {
  const ctx = await getActiveProject(userId);
  return ctx?.project.id ?? null;
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

export async function clearActiveProjectId() {
  try {
    const jar = await cookies();
    jar.delete(PROJECT_COOKIE);
  } catch {
    // Read-only context safe catch
  }
}
