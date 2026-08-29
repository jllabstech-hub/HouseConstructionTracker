"use client";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-xs sm:text-sm text-ink-600 font-medium">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
      <h3 className="font-display text-xl text-ink-900 font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
