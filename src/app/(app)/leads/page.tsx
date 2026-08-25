import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { LeadsManagement, type SerializedLead } from "@/components/leads/leads-management";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  await requireUser();

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized: SerializedLead[] = leads.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email,
    location: l.location,
    plotArea: l.plotArea,
    builtUpArea: l.builtUpArea,
    floors: l.floors,
    budget: l.budget,
    constructionStage: l.constructionStage,
    requirements: l.requirements,
    status: l.status,
    createdAt: l.createdAt.toISOString().slice(0, 10),
  }));

  return <LeadsManagement initialLeads={serialized} />;
}
