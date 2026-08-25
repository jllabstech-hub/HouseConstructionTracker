"use server";

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProject, requireUser } from "@/lib/auth-guard";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadReceipt(expenseId: string, formData: FormData) {
  const user = await requireUser();
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense) return { error: "Expense not found" };
  await requireProject(expense.projectId, user.id);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a receipt file" };
  if (!ALLOWED.has(file.type)) return { error: "Only JPG, PNG, WebP and PDF files are allowed" };
  if (file.size > MAX_BYTES) return { error: "Receipt must be under 8 MB" };

  const ext = extensionFor(file.type);
  const storedName = `${randomUUID()}${ext}`;
  const relative = path.join("receipts", user.id, expenseId, storedName);
  const root = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  const fullPath = path.join(root, relative);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));

  await prisma.receipt.create({
    data: {
      expenseId,
      fileName: file.name,
      storedName,
      mimeType: file.type,
      sizeBytes: file.size,
      storagePath: relative.replaceAll("\\", "/"),
      ocrStatus: "SKIPPED",
    },
  });

  revalidatePath("/expenses");
  return { ok: true };
}

function extensionFor(mime: string) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return ".pdf";
}
