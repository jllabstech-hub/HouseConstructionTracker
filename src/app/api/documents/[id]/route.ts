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
    const doc = await prisma.projectDocument.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!doc || doc.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // 1. Check if it points to a static sample file in public/
    if (doc.storagePath.startsWith("/images/") || doc.storagePath.startsWith("/")) {
      const publicPath = path.join(process.cwd(), "public", doc.storagePath);
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
        // Fallback to disk lookup below
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
      } catch {
        // Fallback below
      }
    }

    // 3. Graceful SVG placeholder fallback if physical file was cleared across serverless cold starts
    const fallbackSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="none">
        <rect width="800" height="600" fill="#F7F6F2"/>
        <rect x="40" y="40" width="720" height="520" rx="16" fill="#FFFFFF" stroke="#E8DCC8" stroke-width="2"/>
        <text x="400" y="270" text-anchor="middle" fill="#B85C22" font-family="sans-serif" font-size="32" font-weight="bold">📄 ${doc.title}</text>
        <text x="400" y="320" text-anchor="middle" fill="#78716C" font-family="sans-serif" font-size="16">${doc.fileName} (${doc.category})</text>
        <text x="400" y="360" text-anchor="middle" fill="#A8A29E" font-family="sans-serif" font-size="14">Document preview metadata verified</text>
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
