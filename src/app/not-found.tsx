import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center p-4 text-[#1C1917]">
      <div className="max-w-md w-full rounded-3xl border border-[#E3D7C5] bg-white p-8 shadow-xs text-center space-y-4">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-[#FBF4EE] text-[#B85C22] font-bold text-2xl">
          404
        </div>
        <div>
          <h1 className="text-xl font-bold font-serif text-[#1C1917]">Page Not Found</h1>
          <p className="text-xs text-[#78716C] mt-1">
            The page or document you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B85C22] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#9A4A1B] transition"
          >
            <Home className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
