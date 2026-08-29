"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { invalidateUserCache } from "@/lib/cache-utils";
import { categorySchema, vendorSchema, workerSchema } from "@/lib/validations";

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createMaterialCategory(input: unknown) {
  try {
    const user = await requireUser();
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category" };
    await prisma.materialCategory.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        groupName: emptyToNull(parsed.data.groupName) ?? "Custom",
      },
    });
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error creating material category:", err);
    return { error: err instanceof Error ? err.message : "Failed to create material category" };
  }
}

export async function createLabourCategory(input: unknown) {
  try {
    const user = await requireUser();
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category" };
    await prisma.labourCategory.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        groupName: emptyToNull(parsed.data.groupName) ?? "Custom",
      },
    });
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error creating labour category:", err);
    return { error: err instanceof Error ? err.message : "Failed to create labour category" };
  }
}

export async function createServiceCategory(input: unknown) {
  try {
    const user = await requireUser();
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category" };
    await prisma.serviceCategory.create({
      data: { userId: user.id, name: parsed.data.name },
    });
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error creating service category:", err);
    return { error: err instanceof Error ? err.message : "Failed to create service category" };
  }
}

export async function createVendor(input: unknown) {
  try {
    const user = await requireUser();
    const parsed = vendorSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid vendor" };
    const vendor = await prisma.vendor.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        company: emptyToNull(parsed.data.company),
        phone: emptyToNull(parsed.data.phone),
        address: emptyToNull(parsed.data.address),
        notes: emptyToNull(parsed.data.notes),
      },
    });
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true, id: vendor.id };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error creating vendor:", err);
    return { error: err instanceof Error ? err.message : "Failed to create vendor" };
  }
}

export async function createWorker(input: unknown) {
  try {
    const user = await requireUser();
    const parsed = workerSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid worker" };
    const worker = await prisma.worker.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        type: parsed.data.type,
        phone: emptyToNull(parsed.data.phone),
        specialization: emptyToNull(parsed.data.specialization),
        notes: emptyToNull(parsed.data.notes),
      },
    });
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true, id: worker.id };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error creating worker:", err);
    return { error: err instanceof Error ? err.message : "Failed to create worker" };
  }
}

export async function updateVendor(id: string, input: unknown) {
  try {
    const user = await requireUser();
    const parsed = vendorSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid vendor" };
    await prisma.vendor.updateMany({
      where: { id, userId: user.id },
      data: {
        name: parsed.data.name,
        company: emptyToNull(parsed.data.company),
        phone: emptyToNull(parsed.data.phone),
        address: emptyToNull(parsed.data.address),
        notes: emptyToNull(parsed.data.notes),
      },
    });
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error updating vendor:", err);
    return { error: err instanceof Error ? err.message : "Failed to update vendor" };
  }
}

export async function updateWorker(id: string, input: unknown) {
  try {
    const user = await requireUser();
    const parsed = workerSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid worker" };
    await prisma.worker.updateMany({
      where: { id, userId: user.id },
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        phone: emptyToNull(parsed.data.phone),
        specialization: emptyToNull(parsed.data.specialization),
        notes: emptyToNull(parsed.data.notes),
      },
    });
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error updating worker:", err);
    return { error: err instanceof Error ? err.message : "Failed to update worker" };
  }
}

export async function deleteVendor(id: string) {
  try {
    const user = await requireUser();
    await prisma.vendor.deleteMany({ where: { id, userId: user.id } });
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error deleting vendor:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete vendor" };
  }
}

export async function deleteWorker(id: string) {
  try {
    const user = await requireUser();
    await prisma.worker.deleteMany({ where: { id, userId: user.id } });
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error deleting worker:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete worker" };
  }
}

