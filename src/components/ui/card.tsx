import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl bg-white p-5 shadow-card border border-paper-200/80", className)}>
      {children}
    </section>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("font-display text-lg text-ink-900", className)}>{children}</h2>;
}
