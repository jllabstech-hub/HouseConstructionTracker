import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
    }

    const doc = await prisma.projectDocument.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!doc || doc.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Document not found or unauthorized" }, { status: 404 });
    }

    // 1. Check if it points to a static sample file in public/
    if (doc.storagePath.startsWith("/images/") || doc.storagePath.startsWith("/")) {
      const normalizedRelative = doc.storagePath.replace(/^\/+/, "");
      const publicPath = path.join(process.cwd(), "public", normalizedRelative);
      const publicRoot = path.join(process.cwd(), "public");

      if (publicPath.startsWith(publicRoot)) {
        try {
          const file = await readFile(publicPath);
          return new NextResponse(file, {
            headers: {
              "Content-Type": doc.mimeType || "application/octet-stream",
              "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
              "Cache-Control": "public, max-age=86400",
            },
          });
        } catch {
          // Fall through to storage directory lookup
        }
      }
    }

    // 2. Lookup in UPLOAD_DIR
    const root = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
    const fullPath = path.join(root, doc.storagePath);

    if (fullPath.startsWith(root)) {
      try {
        const file = await readFile(fullPath);
        return new NextResponse(file, {
          headers: {
            "Content-Type": doc.mimeType || "application/octet-stream",
            "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
            "Cache-Control": "private, max-age=3600",
          },
        });
      } catch (readErr) {
        console.warn(`Document file on disk could not be read: ${fullPath}`, readErr);
      }
    }

    // 3. Graceful SVG placeholder fallback if physical file was cleared or missing
    const safeTitle = (doc.title || "Document").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeFile = (doc.fileName || "file").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const fallbackSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="none">
        <rect width="800" height="600" fill="#F8FAFC"/>
        <rect x="40" y="40" width="720" height="520" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <text x="400" y="270" text-anchor="middle" fill="#0F172A" font-family="sans-serif" font-size="28" font-weight="bold">${safeTitle}</text>
        <text x="400" y="320" text-anchor="middle" fill="#64748B" font-family="sans-serif" font-size="16">${safeFile} (${doc.category})</text>
        <text x="400" y="360" text-anchor="middle" fill="#94A3B8" font-family="sans-serif" font-size="14">Preview unavailable. Please download the file.</text>
      </svg>
    `.trim();

    return new NextResponse(fallbackSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}.svg"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Document API error:", error);
    return NextResponse.json({ error: "Failed to retrieve document" }, { status: 500 });
  }
}
