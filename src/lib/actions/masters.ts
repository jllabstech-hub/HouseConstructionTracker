"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { categorySchema, vendorSchema, workerSchema } from "@/lib/validations";

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createMaterialCategory(input: unknown) {
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
  revalidatePath("/masters");
  return { ok: true };
}

export async function createLabourCategory(input: unknown) {
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
  revalidatePath("/masters");
  return { ok: true };
}

export async function createServiceCategory(input: unknown) {
  const user = await requireUser();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category" };
  await prisma.serviceCategory.create({
    data: { userId: user.id, name: parsed.data.name },
  });
  revalidatePath("/masters");
  return { ok: true };
}

export async function createVendor(input: unknown) {
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
  revalidatePath("/masters");
  return { ok: true, id: vendor.id };
}

export async function createWorker(input: unknown) {
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
  revalidatePath("/masters");
  return { ok: true, id: worker.id };
}

export async function updateVendor(id: string, input: unknown) {
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
  revalidatePath("/masters");
  return { ok: true };
}

export async function updateWorker(id: string, input: unknown) {
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
  revalidatePath("/masters");
  return { ok: true };
}

export async function deleteVendor(id: string) {
  const user = await requireUser();
  await prisma.vendor.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/masters");
  return { ok: true };
}

export async function deleteWorker(id: string) {
  const user = await requireUser();
  await prisma.worker.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/masters");
  return { ok: true };
}

