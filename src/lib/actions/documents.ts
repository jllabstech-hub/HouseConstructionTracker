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

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { error: "Unsupported file type. Please upload a PDF, JPG, PNG, or WEBP file." };
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

  const floorId = emptyToNull(parsed.data.floorId);
  const constructionStageId = emptyToNull(parsed.data.constructionStageId);

  if (floorId) {
    const validFloor = await prisma.floor.findFirst({ where: { id: floorId, projectId } });
    if (!validFloor) return { error: "Selected floor not found in this project" };
  }

  if (constructionStageId) {
    const validStage = await prisma.constructionStage.findFirst({ where: { id: constructionStageId, projectId } });
    if (!validStage) return { error: "Selected stage not found in this project" };
  }

  // Sanitize filename to prevent path traversal
  const sanitizedOriginalName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = extensionFor(mimeType, sanitizedOriginalName);
  const storedName = `${randomUUID()}${ext}`;
  const relative = path.join("documents", user.id, projectId, storedName);
  const root = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  const fullPath = path.join(root, relative);

  // Security check: Ensure path does not escape upload directory
  if (!fullPath.startsWith(root)) {
    return { error: "Invalid storage path" };
  }

  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));

  const doc = await prisma.projectDocument.create({
    data: {
      projectId,
      category: parsed.data.category,
      title: parsed.data.title,
      description: emptyToNull(parsed.data.description),
      version: emptyToNull(parsed.data.version),
      floorId,
      constructionStageId,
      fileName: sanitizedOriginalName,
      storedName,
      mimeType,
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
  const doc = await prisma.projectDocument.findFirst({
    where: { id: documentId, project: { userId: user.id } },
    include: { project: true },
  });
  if (!doc) return { error: "Document not found or unauthorized" };

  const floorId = emptyToNull(input.floorId);
  const constructionStageId = emptyToNull(input.constructionStageId);

  if (floorId) {
    const validFloor = await prisma.floor.findFirst({ where: { id: floorId, projectId: doc.projectId } });
    if (!validFloor) return { error: "Selected floor not found in this project" };
  }

  if (constructionStageId) {
    const validStage = await prisma.constructionStage.findFirst({ where: { id: constructionStageId, projectId: doc.projectId } });
    if (!validStage) return { error: "Selected stage not found in this project" };
  }

  await prisma.projectDocument.update({
    where: { id: documentId },
    data: {
      title: input.title.trim(),
      category: input.category,
      description: emptyToNull(input.description),
      version: emptyToNull(input.version),
      floorId,
      constructionStageId,
      isPinned: input.isPinned ?? doc.isPinned,
    },
  });

  revalidatePath("/documents");
  revalidatePath(`/projects/${doc.projectId}`);
  return { ok: true };
}

export async function togglePinDocument(documentId: string) {
  const user = await requireUser();
  const doc = await prisma.projectDocument.findFirst({
    where: { id: documentId, project: { userId: user.id } },
    include: { project: true },
  });
  if (!doc) return { error: "Document not found or unauthorized" };

  await prisma.projectDocument.update({
    where: { id: documentId },
    data: { isPinned: !doc.isPinned },
  });

  revalidatePath("/documents");
  return { ok: true };
}

export async function deleteDocument(documentId: string) {
  const user = await requireUser();
  const doc = await prisma.projectDocument.findFirst({
    where: { id: documentId, project: { userId: user.id } },
    include: { project: true },
  });
  if (!doc) return { error: "Document not found or unauthorized" };

  // Delete physical file if exists in uploads directory
  try {
    if (!doc.storagePath.startsWith("/images/")) {
      const root = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
      const fullPath = path.join(root, doc.storagePath);
      if (fullPath.startsWith(root)) {
        await unlink(fullPath).catch(() => {});
      }
    }
  } catch {}

  await prisma.projectDocument.deleteMany({ where: { id: documentId, projectId: doc.projectId } });

  revalidatePath("/documents");
  revalidatePath(`/projects/${doc.projectId}`);
  return { ok: true };
}

export async function seedSampleDocuments(projectId: string) {
  const user = await requireUser();
  await requireProject(projectId, user.id);

  const samples = [
    {
      projectId,
      category: "ELEVATION" as const,
      title: "Front 3D Elevation & Landscaping Design",
      description: "Modern 2-floor villa contemporary design with warm spotlights, teak wood paneling, and compound gate.",
      fileName: "elevation_front_view_3d.jpg",
      storedName: "elevation.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1024 * 750,
      storagePath: "/images/stages/elevation.jpg",
      version: "v2.1 Approved",
      isPinned: true,
    },
    {
      projectId,
      category: "FLOOR_PLAN" as const,
      title: "Ground & First Floor Architectural Working Plan",
      description: "Vastu compliant 4BHK architectural layout with car parking, pooja room, modular kitchen, and balconies.",
      fileName: "architectural_floor_plan_approved.jpg",
      storedName: "brickwork.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1024 * 850,
      storagePath: "/images/stages/brickwork.jpg",
      version: "v3.0 Final Sanctioned",
      isPinned: true,
    },
    {
      projectId,
      category: "STRUCTURAL" as const,
      title: "Column Footing & Plinth Beam Structural Drawing",
      description: "Structural engineer rebar reinforcement details: 16mm/20mm Fe550D steel cage schedules and M25 mix design.",
      fileName: "structural_footing_reinforcement.jpg",
      storedName: "foundation.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1024 * 620,
      storagePath: "/images/stages/foundation.jpg",
      version: "Rev 1",
      isPinned: false,
    },
    {
      projectId,
      category: "STRUCTURAL" as const,
      title: "Roof Slab Shuttering & Reinforcement Schedule",
      description: "Two-way slab bar bending schedule, crank bar details, and electrical conduit routing map.",
      fileName: "slab_reinforcement_schedule.jpg",
      storedName: "slab.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1024 * 890,
      storagePath: "/images/stages/slab.jpg",
      version: "v1.2",
      isPinned: false,
    },
    {
      projectId,
      category: "MEP" as const,
      title: "Electrical Conduit & Plumbing Layout Drawing",
      description: "Distribution board circuits, AC point locations, concealed CPVC water supply, and drainage line slope markings.",
      fileName: "mep_electrical_plumbing_layout.jpg",
      storedName: "interior.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1024 * 510,
      storagePath: "/images/stages/interior.jpg",
      version: "v1.0",
      isPinned: false,
    },
    {
      projectId,
      category: "APPROVAL" as const,
      title: "BBMP / Gram Panchayat Building Plan Sanction Permit",
      description: "Official municipal building permit LP no. 482/2026 with BESCOM electricity sanction and borewell clearance.",
      fileName: "bbmp_building_sanction_permit.jpg",
      storedName: "flooring.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1024 * 920,
      storagePath: "/images/stages/flooring.jpg",
      version: "Official Sanction",
      isPinned: true,
    },
    {
      projectId,
      category: "SITE_PHOTO" as const,
      title: "Site Footing Excavation & Concrete Pouring Progress",
      description: "Live photo taken at site during column footing concreting and vibrating.",
      fileName: "site_excavation_photo_aug.jpg",
      storedName: "foundation.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1024 * 670,
      storagePath: "/images/stages/foundation.jpg",
      version: "Site Progress",
      isPinned: false,
    },
  ];

  await prisma.projectDocument.createMany({
    data: samples,
  });

  revalidatePath("/documents");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { ok: true, count: samples.length };
}
