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
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: { expense: { include: { project: true } } },
    });
    if (!receipt || receipt.expense.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 1. Check if public static image
    if (receipt.storagePath.startsWith("/images/") || receipt.storagePath.startsWith("/")) {
      const publicPath = path.join(process.cwd(), "public", receipt.storagePath);
      try {
        const file = await readFile(publicPath);
        return new NextResponse(file, {
          headers: {
            "Content-Type": receipt.mimeType || "application/octet-stream",
            "Content-Disposition": `inline; filename="${encodeURIComponent(receipt.fileName)}"`,
            "Cache-Control": "public, max-age=86400",
          },
        });
      } catch {
        // Fallback below
      }
    }

    // 2. Check UPLOAD_DIR
    const root = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
    const fullPath = path.join(root, receipt.storagePath);

    if (fullPath.startsWith(root)) {
      try {
        const file = await readFile(fullPath);
        return new NextResponse(file, {
          headers: {
            "Content-Type": receipt.mimeType || "application/octet-stream",
            "Content-Disposition": `inline; filename="${encodeURIComponent(receipt.fileName)}"`,
            "Cache-Control": "private, max-age=3600",
          },
        });
      } catch {
        // Fallback below
      }
    }

    // 3. Fallback SVG receipt card
    const fallbackSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="none">
        <rect width="600" height="800" fill="#F7F6F2"/>
        <rect x="30" y="30" width="540" height="740" rx="16" fill="#FFFFFF" stroke="#E8DCC8" stroke-width="2"/>
        <text x="300" y="320" text-anchor="middle" fill="#C56A2D" font-family="sans-serif" font-size="28" font-weight="bold">Purchase Receipt</text>
        <text x="300" y="370" text-anchor="middle" fill="#78716C" font-family="sans-serif" font-size="16">${receipt.fileName}</text>
        <text x="300" y="410" text-anchor="middle" fill="#A8A29E" font-family="sans-serif" font-size="14">Invoice: ${receipt.ocrInvoiceNumber || "—"}</text>
        <text x="300" y="450" text-anchor="middle" fill="#A8A29E" font-family="sans-serif" font-size="14">Vendor: ${receipt.ocrVendor || "—"}</text>
      </svg>
    `.trim();

    return new NextResponse(fallbackSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `inline; filename="${encodeURIComponent(receipt.fileName)}.svg"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Receipt API error:", error);
    return NextResponse.json({ error: "Failed to retrieve receipt" }, { status: 500 });
  }
}
