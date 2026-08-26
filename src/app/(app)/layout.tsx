import { requireUser } from "@/lib/auth-guard";
import { getActiveProject } from "@/lib/project-context";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const ctx = await getActiveProject(user.id);

  return (
    <AppShell
      userName={user.name ?? user.email ?? "Homeowner"}
      projects={ctx?.projects ?? []}
      activeProjectId={ctx?.project.id ?? null}
    >
      {children}
    </AppShell>
  );
}
