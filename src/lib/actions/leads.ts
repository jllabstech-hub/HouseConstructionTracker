"use server";

import { revalidatePath } from "next/cache";
import { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().min(10, "Please enter a valid 10-digit phone number"),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  location: z.string().trim().min(2, "Please enter project city or locality"),
  plotArea: z.string().trim().optional(),
  builtUpArea: z.string().trim().optional(),
  floors: z.string().trim().optional(),
  budget: z.string().trim().optional(),
  constructionStage: z.string().trim().optional(),
  requirements: z.string().trim().optional(),
});

export async function createLead(formData: FormData) {
  try {
    const raw = {
      name: formData.get("name")?.toString() ?? "",
      phone: formData.get("phone")?.toString() ?? "",
      email: formData.get("email")?.toString() || undefined,
      location: formData.get("location")?.toString() ?? "",
      plotArea: formData.get("plotArea")?.toString() || undefined,
      builtUpArea: formData.get("builtUpArea")?.toString() || undefined,
      floors: formData.get("floors")?.toString() || undefined,
      budget: formData.get("budget")?.toString() || undefined,
      constructionStage: formData.get("constructionStage")?.toString() || undefined,
      requirements: formData.get("requirements")?.toString() || undefined,
    };

    const parsed = leadSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Please check form entries" };
    }

    const lead = await prisma.lead.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        location: parsed.data.location,
        plotArea: parsed.data.plotArea || null,
        builtUpArea: parsed.data.builtUpArea || null,
        floors: parsed.data.floors || null,
        budget: parsed.data.budget || null,
        constructionStage: parsed.data.constructionStage || null,
        requirements: parsed.data.requirements || null,
        status: "NEW",
      },
    });

    revalidatePath("/leads");
    return { ok: true, leadId: lead.id };
  } catch (error: unknown) {
    console.error("Create lead error:", error);
    const msg = error instanceof Error ? error.message : "Failed to submit estimate request";
    return { error: msg };
  }
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  await requireUser();

  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });

    revalidatePath("/leads");
    return { ok: true };
  } catch (error: unknown) {
    console.error("Update lead status error:", error);
    const msg = error instanceof Error ? error.message : "Failed to update status";
    return { error: msg };
  }
}

export async function deleteLead(leadId: string) {
  await requireUser();

  try {
    await prisma.lead.delete({
      where: { id: leadId },
    });

    revalidatePath("/leads");
    return { ok: true };
  } catch (error: unknown) {
    console.error("Delete lead error:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete lead";
    return { error: msg };
  }
}
