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
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { expense: { include: { project: true } } },
  });
  if (!receipt || receipt.expense.project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const root = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  const fullPath = path.join(root, receipt.storagePath);

  if (!fullPath.startsWith(root)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const file = await readFile(fullPath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": receipt.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(receipt.fileName)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Receipt file not found on disk" }, { status: 404 });
  }
}
