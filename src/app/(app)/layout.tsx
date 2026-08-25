import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  const activeProjectId = await getActiveProjectId(user.id);

  return (
    <AppShell userName={user.name ?? user.email ?? "Homeowner"} projects={projects} activeProjectId={activeProjectId}>
      {children}
    </AppShell>
  );
}
