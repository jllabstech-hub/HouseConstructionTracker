import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
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

  // Check if it points to a static sample file
  if (doc.storagePath.startsWith("/images/")) {
    const publicPath = path.join(process.cwd(), "public", doc.storagePath);
    try {
      const file = await readFile(publicPath);
      return new NextResponse(file, {
        headers: {
          "Content-Type": doc.mimeType,
          "Content-Disposition": `inline; filename="${doc.fileName}"`,
        },
      });
    } catch {
      // Fallback
    }
  }

  const root = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  const fullPath = path.join(root, doc.storagePath);
  try {
    const file = await readFile(fullPath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${doc.fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }
}
