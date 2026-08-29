import { Suspense } from "react";
import LoginForm from "./login-form";
import { Building2 } from "lucide-react";

function LoginSkeleton() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper-50 px-4 py-4 sm:py-8">
      <div className="w-full max-w-md space-y-4 sm:space-y-5 rounded-3xl bg-white p-5 sm:p-8 shadow-card border border-paper-200 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-clay-600 text-white shadow-xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <div className="h-6 w-36 bg-paper-200 rounded-md" />
            <div className="h-3.5 w-48 bg-paper-100 rounded-md" />
          </div>
        </div>
        <div className="h-14 bg-paper-100 rounded-2xl" />
        <div className="h-4 bg-paper-100 rounded w-2/3 mx-auto" />
        <div className="space-y-3">
          <div className="h-12 bg-paper-100 rounded-xl" />
          <div className="h-12 bg-paper-100 rounded-xl" />
          <div className="h-11 bg-clay-200 rounded-xl" />
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
