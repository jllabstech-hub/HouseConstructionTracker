"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ExternalLink } from "lucide-react";
import { deleteProject, switchProject } from "@/lib/actions/projects";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ProjectCardActions({
  projectId,
  projectName,
  isActive,
}: {
  projectId: string;
  projectName: string;
  isActive?: boolean;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, start] = useTransition();

  const handleDelete = () => {
    start(async () => {
      await deleteProject(projectId);
      setShowConfirm(false);
      router.refresh();
    });
  };

  const handleSwitch = () => {
    start(async () => {
      await switchProject(projectId);
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="mt-4 flex items-center justify-between border-t border-paper-100 pt-3 text-xs">
      <div className="flex items-center gap-3 font-semibold text-clay-700">
        <Link href={`/projects/${projectId}`} className="hover:underline flex items-center gap-1">
          <span>Overview</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
        <Link href={`/projects/${projectId}/stages`} className="hover:underline">Stages</Link>
        <Link href={`/projects/${projectId}/floors`} className="hover:underline">Floors</Link>
      </div>

      <div className="flex items-center gap-2">
        {!isActive && (
          <button
            type="button"
            onClick={handleSwitch}
            disabled={pending}
            className="rounded-lg bg-clay-50 hover:bg-clay-100 px-2.5 py-1 font-bold text-clay-800 transition"
          >
            {pending ? "Switching..." : "Make Active"}
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={pending}
          className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-700 transition"
          title={`Delete ${projectName}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete House Project?"
        description={`Are you sure you want to permanently delete "${projectName}"? All related construction stages, expenses, documents, and category budgets for this project will be deleted.`}
        confirmText={pending ? "Deleting..." : "Delete Project"}
        variant="danger"
      />
    </div>
  );
}
