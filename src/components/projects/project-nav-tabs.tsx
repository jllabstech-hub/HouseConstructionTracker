"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Milestone, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectNavTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/projects/${projectId}`, label: "Overview & Details", icon: Home, exact: true },
    { href: `/projects/${projectId}/stages`, label: "Construction Stages", icon: Milestone, exact: false },
    { href: `/projects/${projectId}/floors`, label: "Floors & Levels", icon: Layers, exact: false },
  ];

  return (
    <div className="flex overflow-x-auto no-scrollbar gap-2 p-1 bg-paper-100/80 rounded-2xl border border-paper-200">
      {tabs.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs",
              isActive
                ? "bg-clay-600 text-white shadow-sm"
                : "bg-white text-ink-700 hover:bg-paper-50",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
