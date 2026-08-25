"use server";

import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProject, requireUser } from "@/lib/auth-guard";
import { documentSchema } from "@/lib/validations";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/acad",
  "application/x-dwg",
  "image/vnd.dwg",
]);

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function extensionFor(mime: string, originalName: string) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/svg+xml") return ".svg";
  if (mime === "application/pdf") return ".pdf";
  const ext = path.extname(originalName);
  return ext || ".pdf";
}

export async function uploadDocument(projectId: string, formData: FormData) {
  const user = await requireUser();
  await requireProject(projectId, user.id);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a blueprint, drawing or photo file" };
  }

  if (file.size > MAX_BYTES) {
    return { error: "File must be under 20 MB" };
  }

  const raw = {
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description"),
    version: formData.get("version"),
    floorId: formData.get("floorId"),
    constructionStageId: formData.get("constructionStageId"),
  };

  const parsed = documentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid document details" };
  }

  const ext = extensionFor(file.type, file.name);
  const storedName = `${randomUUID()}${ext}`;
  const relative = path.join("documents", user.id, projectId, storedName);
  const root = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  const fullPath = path.join(root, relative);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));

  const doc = await prisma.projectDocument.create({
    data: {
      projectId,
      category: parsed.data.category,
      title: parsed.data.title,
      description: emptyToNull(parsed.data.description),
      version: emptyToNull(parsed.data.version),
      floorId: emptyToNull(parsed.data.floorId),
      constructionStageId: emptyToNull(parsed.data.constructionStageId),
      fileName: file.name,
      storedName,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storagePath: relative.replaceAll("\\", "/"),
      isPinned: formData.get("isPinned") === "true",
    },
  });

  revalidatePath("/documents");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { ok: true, id: doc.id };
}

export async function updateDocument(
  documentId: string,
  input: {
    title: string;
    category: "FLOOR_PLAN" | "STRUCTURAL" | "ELEVATION" | "MEP" | "APPROVAL" | "SITE_PHOTO" | "CONTRACT" | "OTHER";
    description?: string | null;
    version?: string | null;
    floorId?: string | null;
    constructionStageId?: string | null;
    isPinned?: boolean;
  }
) {
  const user = await requireUser();
  const doc = await prisma.projectDocument.findUnique({
    where: { id: documentId },
    include: { project: true },
  });
  if (!doc || doc.project.userId !== user.id) return { error: "Document not found" };

  await prisma.projectDocument.update({
    where: { id: documentId },
    data: {
      title: input.title.trim(),
      category: input.category,
      description: emptyToNull(input.description),
      version: emptyToNull(input.version),
      floorId: emptyToNull(input.floorId),
      constructionStageId: emptyToNull(input.constructionStageId),
      isPinned: input.isPinned ?? doc.isPinned,
    },
  });

  revalidatePath("/documents");
  revalidatePath(`/projects/${doc.projectId}`);
  return { ok: true };
}

export async function togglePinDocument(documentId: string) {
  const user = await requireUser();
  const doc = await prisma.projectDocument.findUnique({
    where: { id: documentId },
    include: { project: true },
  });
  if (!doc || doc.project.userId !== user.id) return { error: "Document not found" };

  await prisma.projectDocument.update({
    where: { id: documentId },
    data: { isPinned: !doc.isPinned },
  });

  revalidatePath("/documents");
  return { ok: true };
}

export async function deleteDocument(documentId: string) {
  const user = await requireUser();
  const doc = await prisma.projectDocument.findUnique({
    where: { id: documentId },
    include: { project: true },
  });
  if (!doc || doc.project.userId !== user.id) return { error: "Document not found" };

  // Delete physical file if exists in uploads directory
  try {
    if (!doc.storagePath.startsWith("/images/")) {
      const root = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
      const fullPath = path.join(root, doc.storagePath);
      await unlink(fullPath).catch(() => {});
    }
  } catch {}

  await prisma.projectDocument.delete({ where: { id: documentId } });

  revalidatePath("/documents");
  revalidatePath(`/projects/${doc.projectId}`);
  return { ok: true };
}
