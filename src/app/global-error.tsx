"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#F7F6F2", color: "#1C1917" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ maxWidth: "420px", width: "100%", background: "#FFFFFF", border: "1px solid #E8DCC8", borderRadius: "24px", padding: "32px", textAlign: "center", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
            <div style={{ width: "56px", height: "56px", margin: "0 auto 16px", borderRadius: "16px", background: "#FBF4EE", color: "#C56A2D", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 8px" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: "13px", color: "#78716C", lineHeight: 1.5, margin: "0 0 20px" }}>
              A critical application error occurred. You can reload the page to continue.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{ background: "#B85C22", color: "#FFFFFF", border: "none", borderRadius: "12px", padding: "10px 20px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
