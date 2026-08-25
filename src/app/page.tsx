import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-paper-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center">
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-clay-700">House Construction Tracker</p>
          <h1 className="mt-3 font-display text-5xl leading-tight text-ink-900">
            Track every rupee. Never mix material with labour.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-600">
            A construction financial system for homeowners — cement purchases stay separate from masonry labour,
            budgets stay honest, and reports are ready to share.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-xl bg-clay-600 px-5 py-3 font-semibold text-white">
              Sign in
            </Link>
            <Link href="/register" className="rounded-xl border border-ink-200 bg-white px-5 py-3 font-semibold text-ink-800">
              Create account
            </Link>
          </div>
          <p className="mt-6 text-sm text-ink-500">Demo: admin / test123</p>
        </div>
        <div className="flex-1 rounded-3xl bg-white p-6 shadow-card">
          <p className="text-xs font-semibold uppercase text-ink-500">Cement / Masonry work</p>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between border-b border-paper-200 pb-2">
              <dt>Material</dt>
              <dd className="font-semibold">₹2,80,000</dd>
            </div>
            <div className="flex justify-between border-b border-paper-200 pb-2">
              <dt>Labour</dt>
              <dd className="font-semibold">₹1,20,000</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-display text-lg">Total</dt>
              <dd className="font-display text-lg text-clay-700">₹4,00,000</dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}
