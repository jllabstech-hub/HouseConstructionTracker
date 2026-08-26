import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedProjectOrNull } from "@/lib/auth-guard";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { formatINR } from "@/lib/money";

// 20 Canonical Chronological Construction Stages
const CANONICAL_STAGES = [
  { step: 1, name: "Planning, Architectural Designs & Municipal Approvals", shortName: "Planning & Approvals", keywords: "plan blueprint architecture sanction permit permission municipal drawing 2d 3d" },
  { step: 2, name: "Site Clearing, Levelling & Borewell Drilling", shortName: "Site Clearing & Borewell", keywords: "clearing leveling borewell water water connection digging ground" },
  { step: 3, name: "Earthwork Excavation for Foundations", shortName: "Earthwork & Excavation", keywords: "excavation digging earthwork soil foundation trench footing pits" },
  { step: 4, name: "PCC, Footings & Substructure Foundation", shortName: "Footings & Foundation", keywords: "pcc footing foundation rcc steel reinforcement concrete substructure" },
  { step: 5, name: "Plinth Beam, Underground Sump & DPC", shortName: "Plinth Beam & Sump", keywords: "plinth beam water sump underground dpc damp proof course" },
  { step: 6, name: "Backfilling, Compaction & Anti-Termite Treatment", shortName: "Backfilling & Termite", keywords: "backfilling soil compaction termite pest control gravel sand filling" },
  { step: 7, name: "RCC Columns, Pillars & Superstructure Framework", shortName: "RCC Columns & Framing", keywords: "columns pillars rcc framing shuttering steel reinforcement casting" },
  { step: 8, name: "Red Brick / AAC Block Masonry Walls", shortName: "Brick & Block Masonry", keywords: "brick masonry aac blocks walls red bricks cement mortar partitions" },
  { step: 9, name: "Lintel Beams, Sunshades & Chajjas", shortName: "Lintels & Sunshades", keywords: "lintel beam sunshade chajja window top door top casting concrete" },
  { step: 10, name: "Roof Slab Centering, Shuttering, Rebar & Casting", shortName: "Roof Slab Casting", keywords: "slab roof casting centering shuttering rmc concrete rebar curing" },
  { step: 11, name: "Door & Window Frames (Chowkaths) Fixing", shortName: "Door & Window Frames", keywords: "door frames chowkaths wood teak windows granite frames upvc fixing" },
  { step: 12, name: "Internal & External Wall Plastering", shortName: "Wall Plastering", keywords: "plastering cement plaster internal external spongy ceiling plastering" },
  { step: 13, name: "Concealed Electrical Piping & Wiring Conduits", shortName: "Electrical Piping & Wiring", keywords: "electrical conduit wiring pipes switch boxes concealed wires electrician" },
  { step: 14, name: "Plumbing Concealed Lines & Drainage Sinks", shortName: "Plumbing & Drainage", keywords: "plumbing water pipes cpvc upvc drainage sewage sanitary lines plumber" },
  { step: 15, name: "Flooring, Granite, Marble & Vitrified Tiles", shortName: "Flooring & Tiles", keywords: "flooring tiles vitrified granite marble kitchen platform bathroom wall tiles" },
  { step: 16, name: "Internal & External Painting, Wall Putty & Primer", shortName: "Painting & Wall Putty", keywords: "painting paint wall putty primer emulsion exterior apex painter brush roller" },
  { step: 17, name: "Modular Kitchen, Wardrobes & Woodwork", shortName: "Modular Kitchen & Wood", keywords: "modular kitchen wardrobes carpentry plywood laminates wood interior cabinets" },
  { step: 18, name: "Bathroom Fixtures, Sanitaryware & Electrical Switches", shortName: "Sanitary & Electricals", keywords: "taps commode basin sanitaryware switches led lights fans geyser lights" },
  { step: 19, name: "Compound Wall, Main Gate & Exterior Elevation", shortName: "Compound Wall & Gate", keywords: "compound wall boundary main gate ms gate elevation texture tiles exterior" },
  { step: 20, name: "Deep Cleaning, Electrical Meter & Housewarming", shortName: "Deep Cleaning & Handover", keywords: "deep cleaning housewarming gruhapravesam electrical meter eb power handover" },
];

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const project = await getOwnedProjectOrNull(projectId, session.user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Load project expenses & masters in parallel
  const [expenses, materials, labours, vendors, workers, stages, documents, receipts] = await Promise.all([
    loadProjectExpenses(projectId),
    prisma.materialCategory.findMany({ where: { userId: session.user.id } }),
    prisma.labourCategory.findMany({ where: { userId: session.user.id } }),
    prisma.vendor.findMany({ where: { userId: session.user.id } }),
    prisma.worker.findMany({ where: { userId: session.user.id } }),
    prisma.constructionStage.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
    prisma.projectDocument.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } }),
    prisma.receipt.findMany({ where: { expense: { projectId } }, take: 30, orderBy: { createdAt: "desc" } }),
  ]);

  if (!q) {
    // Default Suggested Navigation & Recent Activities
    return NextResponse.json({
      query: "",
      smartReport: null,
      expenses: expenses.slice(0, 4).map((e) => ({
        id: e.id,
        date: e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10),
        amount: formatINR(e.amount),
        rawAmount: Number(e.amount),
        description: e.description ?? "Expense",
        category: e.materialCategoryName ?? e.labourCategoryName ?? e.expenseType,
        party: e.vendorName ? `🏪 ${e.vendorName}` : e.workerName ? `👷 ${e.workerName}` : null,
        paymentMethod: e.paymentMethod,
        url: `/expenses/${e.id}`,
      })),
      contacts: [],
      stages: [],
      documents: documents.slice(0, 3).map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        url: `/documents`,
      })),
      navigation: [
        { title: "Record New Expense", url: "/expenses/new", subtitle: "Log material purchase or labour wage bill", section: "Actions" },
        { title: "Reports & PDF Statements", url: "/reports", subtitle: "Download expenditure & vendor PDF statements", section: "Finance" },
        { title: "Phone Directory", url: "/phonedirectory", subtitle: "Hardware shops, masons & UPI direct pay", section: "Directory" },
        { title: "Construction Stages (20 Milestones)", url: "/stages", subtitle: "Sequential progress from foundation to handover", section: "Project" },
        { title: "Budget & Plans", url: "/budget", subtitle: "Total budget ceiling and category spending limits", section: "Finance" },
        { title: "Documents & Blueprints", url: "/documents", subtitle: "Architectural drawings and municipal permits", section: "Files" },
      ],
    });
  }

  // 1. SMART REPORT DETECTION & SYNTHESIS
  // Checks if the user query is asking for a report on a person, material, trade, stage or overall
  let smartReport: {
    title: string;
    subtitle: string;
    kind: string;
    totalAmount: number;
    totalFormatted: string;
    count: number;
    pdfDownloadUrl: string;
    pdfPreviewUrl: string;
    reportHubUrl: string;
    recentTransactions: {
      id?: string;
      date: string;
      category: string;
      description: string;
      party: string;
      amount: string;
    }[];
  } | null = null;

  // Matching Worker / Mason / Contractor
  const matchedWorker = workers.find(
    (w) =>
      w.name.toLowerCase().includes(q) ||
      (w.specialization && w.specialization.toLowerCase().includes(q)) ||
      (w.type && w.type.toLowerCase().includes(q)) ||
      q.includes(w.name.toLowerCase()) ||
      (w.specialization && q.includes(w.specialization.toLowerCase()))
  );

  // Matching Labour Category / Trade (e.g. "painting", "masonry", "plumbing", "carpentry")
  const matchedLabourCat = labours.find(
    (l) => l.name.toLowerCase().includes(q) || q.includes(l.name.toLowerCase())
  );

  // Matching Material Category (e.g. "cement", "steel", "sand", "bricks", "paint", "tiles", "pipes")
  const matchedMaterial = materials.find(
    (m) => m.name.toLowerCase().includes(q) || q.includes(m.name.toLowerCase())
  );

  // Matching Vendor / Shop (e.g. "balaji", "hardware", "sharma")
  const matchedVendor = vendors.find(
    (v) =>
      v.name.toLowerCase().includes(q) ||
      (v.company && v.company.toLowerCase().includes(q)) ||
      q.includes(v.name.toLowerCase())
  );

  // Matching Stage (e.g. "foundation", "slab", "brickwork", "plastering", "excavation")
  const matchedStage = stages.find(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      q.includes(s.name.toLowerCase()) ||
      q.includes(`stage ${s.sortOrder}`) ||
      q.includes(`step ${s.sortOrder}`)
  );

  const isAskingForReport =
    q.includes("report") ||
    q.includes("bill") ||
    q.includes("paid") ||
    q.includes("cost") ||
    q.includes("expense") ||
    q.includes("statement") ||
    q.includes("total") ||
    q.includes("summary") ||
    q.includes("wages") ||
    q.includes("ledger") ||
    matchedWorker != null ||
    matchedLabourCat != null ||
    matchedMaterial != null ||
    matchedVendor != null ||
    matchedStage != null;

  if (isAskingForReport) {
    if (matchedWorker) {
      const workerExpenses = expenses.filter(
        (e) =>
          e.workerId === matchedWorker.id ||
          (e.workerName && e.workerName.toLowerCase().includes(matchedWorker.name.toLowerCase())) ||
          (matchedWorker.specialization && (e.description || "").toLowerCase().includes(matchedWorker.specialization.toLowerCase()))
      );
      const total = workerExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const pdfQuery = new URLSearchParams({
        projectId,
        kind: "worker",
        workerId: matchedWorker.id,
        workerName: matchedWorker.name,
      });

      smartReport = {
        title: `${matchedWorker.name} - Wages & Payout Statement`,
        subtitle: `Attendance wages and contract payouts paid to ${matchedWorker.name} (${matchedWorker.specialization ?? matchedWorker.type})`,
        kind: "worker",
        totalAmount: total,
        totalFormatted: formatINR(total),
        count: workerExpenses.length,
        pdfDownloadUrl: `/api/reports/pdf?${pdfQuery.toString()}&download=1`,
        pdfPreviewUrl: `/api/reports/pdf?${pdfQuery.toString()}`,
        reportHubUrl: `/reports`,
        recentTransactions: workerExpenses.slice(0, 6).map((e) => ({
          id: e.id,
          date: e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10),
          category: e.labourCategoryName ?? "Labour Payout",
          description: e.description ?? "Wages",
          party: e.workerName ?? matchedWorker.name,
          amount: formatINR(e.amount),
        })),
      };
    } else if (matchedLabourCat) {
      const catExpenses = expenses.filter(
        (e) =>
          e.labourCategoryId === matchedLabourCat.id ||
          (e.labourCategoryName && e.labourCategoryName.toLowerCase().includes(matchedLabourCat.name.toLowerCase())) ||
          (e.description && e.description.toLowerCase().includes(matchedLabourCat.name.toLowerCase()))
      );
      const total = catExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const pdfQuery = new URLSearchParams({
        projectId,
        kind: "labour",
        categoryId: matchedLabourCat.id,
        categoryName: matchedLabourCat.name,
      });

      smartReport = {
        title: `${matchedLabourCat.name} - Labour Wages Report`,
        subtitle: `All labour wage payments and contractor bills for ${matchedLabourCat.name}`,
        kind: "labour",
        totalAmount: total,
        totalFormatted: formatINR(total),
        count: catExpenses.length,
        pdfDownloadUrl: `/api/reports/pdf?${pdfQuery.toString()}&download=1`,
        pdfPreviewUrl: `/api/reports/pdf?${pdfQuery.toString()}`,
        reportHubUrl: `/reports`,
        recentTransactions: catExpenses.slice(0, 6).map((e) => ({
          id: e.id,
          date: e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10),
          category: matchedLabourCat.name,
          description: e.description ?? "Labour",
          party: e.workerName ?? "Worker",
          amount: formatINR(e.amount),
        })),
      };
    } else if (matchedMaterial) {
      const matExpenses = expenses.filter(
        (e) =>
          e.materialCategoryId === matchedMaterial.id ||
          (e.materialCategoryName && e.materialCategoryName.toLowerCase().includes(matchedMaterial.name.toLowerCase())) ||
          (e.description && e.description.toLowerCase().includes(matchedMaterial.name.toLowerCase()))
      );
      const total = matExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const pdfQuery = new URLSearchParams({
        projectId,
        kind: "material",
        categoryId: matchedMaterial.id,
        categoryName: matchedMaterial.name,
      });

      smartReport = {
        title: `${matchedMaterial.name} Purchases & Usage Report`,
        subtitle: `Itemized purchase bills, quantities, and rates for ${matchedMaterial.name}`,
        kind: "material",
        totalAmount: total,
        totalFormatted: formatINR(total),
        count: matExpenses.length,
        pdfDownloadUrl: `/api/reports/pdf?${pdfQuery.toString()}&download=1`,
        pdfPreviewUrl: `/api/reports/pdf?${pdfQuery.toString()}`,
        reportHubUrl: `/reports`,
        recentTransactions: matExpenses.slice(0, 6).map((e) => ({
          id: e.id,
          date: e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10),
          category: matchedMaterial.name,
          description: e.description ?? `${matchedMaterial.name} purchase`,
          party: e.vendorName ?? "Hardware Shop",
          amount: formatINR(e.amount),
        })),
      };
    } else if (matchedVendor) {
      const vendorExpenses = expenses.filter(
        (e) =>
          e.vendorId === matchedVendor.id ||
          (e.vendorName && e.vendorName.toLowerCase().includes(matchedVendor.name.toLowerCase()))
      );
      const total = vendorExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const pdfQuery = new URLSearchParams({
        projectId,
        kind: "vendor",
        vendorId: matchedVendor.id,
        vendorName: matchedVendor.name,
      });

      smartReport = {
        title: `${matchedVendor.name} - Vendor Purchase Ledger`,
        subtitle: `Complete purchase and payment transaction ledger for ${matchedVendor.name} (${matchedVendor.company ?? "Hardware Store"})`,
        kind: "vendor",
        totalAmount: total,
        totalFormatted: formatINR(total),
        count: vendorExpenses.length,
        pdfDownloadUrl: `/api/reports/pdf?${pdfQuery.toString()}&download=1`,
        pdfPreviewUrl: `/api/reports/pdf?${pdfQuery.toString()}`,
        reportHubUrl: `/reports`,
        recentTransactions: vendorExpenses.slice(0, 6).map((e) => ({
          id: e.id,
          date: e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10),
          category: e.materialCategoryName ?? "Material",
          description: e.description ?? "Purchase",
          party: matchedVendor.name,
          amount: formatINR(e.amount),
        })),
      };
    } else if (matchedStage) {
      const stageExpenses = expenses.filter(
        (e) =>
          e.stageId === matchedStage.id ||
          e.constructionStageId === matchedStage.id ||
          (e.stageName && e.stageName.toLowerCase().includes(matchedStage.name.toLowerCase()))
      );
      const total = stageExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const pdfQuery = new URLSearchParams({
        projectId,
        kind: "stage",
        stageId: matchedStage.id,
        stageName: matchedStage.name,
      });

      smartReport = {
        title: `Stage ${matchedStage.sortOrder}: ${matchedStage.name} Cost Report`,
        subtitle: `All materials, labour wages and contractor payouts for Stage ${matchedStage.sortOrder}`,
        kind: "stage",
        totalAmount: total,
        totalFormatted: formatINR(total),
        count: stageExpenses.length,
        pdfDownloadUrl: `/api/reports/pdf?${pdfQuery.toString()}&download=1`,
        pdfPreviewUrl: `/api/reports/pdf?${pdfQuery.toString()}`,
        reportHubUrl: `/stages/${matchedStage.sortOrder}`,
        recentTransactions: stageExpenses.slice(0, 6).map((e) => ({
          id: e.id,
          date: e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10),
          category: e.materialCategoryName ?? e.labourCategoryName ?? e.expenseType,
          description: e.description ?? `Stage ${matchedStage.sortOrder}`,
          party: e.vendorName ?? e.workerName ?? "—",
          amount: formatINR(e.amount),
        })),
      };
    } else if (q.includes("total") || q.includes("project") || q.includes("overall") || q.includes("all")) {
      const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      smartReport = {
        title: "Total Project Expenditure Statement",
        subtitle: `Complete master expenditure audit and summary across all 20 construction stages`,
        kind: "total",
        totalAmount: total,
        totalFormatted: formatINR(total),
        count: expenses.length,
        pdfDownloadUrl: `/api/reports/pdf?projectId=${projectId}&kind=total&download=1`,
        pdfPreviewUrl: `/api/reports/pdf?projectId=${projectId}&kind=total`,
        reportHubUrl: `/reports`,
        recentTransactions: expenses.slice(0, 6).map((e) => ({
          id: e.id,
          date: e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10),
          category: e.materialCategoryName ?? e.labourCategoryName ?? e.expenseType,
          description: e.description ?? "Expense",
          party: e.vendorName ?? e.workerName ?? "—",
          amount: formatINR(e.amount),
        })),
      };
    }
  }

  // 2. MATCHING EXPENSES (Line Items, Bills, Notes, Amounts)
  const matchedExpenses = expenses
    .filter((e) => {
      const desc = (e.description ?? "").toLowerCase();
      const cat = (e.materialCategoryName ?? e.labourCategoryName ?? e.serviceCategoryName ?? e.expenseType).toLowerCase();
      const party = (e.vendorName ?? e.workerName ?? "").toLowerCase();
      const invoice = (e.invoiceNumber ?? "").toLowerCase();
      const stName = (e.stageName ?? "").toLowerCase();
      const notes = (e.notes ?? "").toLowerCase();
      const amountStr = String(e.amount);
      return (
        desc.includes(q) ||
        cat.includes(q) ||
        party.includes(q) ||
        invoice.includes(q) ||
        stName.includes(q) ||
        notes.includes(q) ||
        amountStr.includes(q)
      );
    })
    .slice(0, 8)
    .map((e) => ({
      id: e.id,
      date: e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10),
      amount: formatINR(e.amount),
      rawAmount: Number(e.amount),
      description: e.description ?? "Expense",
      category: e.materialCategoryName ?? e.labourCategoryName ?? e.expenseType,
      party: e.vendorName ? `🏪 ${e.vendorName}` : e.workerName ? `👷 ${e.workerName}` : null,
      paymentMethod: e.paymentMethod,
      url: `/expenses/${e.id}`,
    }));

  // 3. MATCHING CONTACTS (Vendors, Hardware Stores & Workers)
  const matchedContacts = [
    ...vendors
      .filter((v) => {
        const name = v.name.toLowerCase();
        const company = (v.company ?? "").toLowerCase();
        const phone = (v.phone ?? "").toLowerCase();
        const notes = (v.notes ?? "").toLowerCase();
        const address = (v.address ?? "").toLowerCase();
        return name.includes(q) || company.includes(q) || phone.includes(q) || notes.includes(q) || address.includes(q);
      })
      .map((v) => ({
        id: v.id,
        name: v.name,
        type: "VENDOR" as const,
        badge: "🏪 Hardware / Vendor Shop",
        subtitle: v.company ?? v.phone ?? "Vendor Shop",
        phone: v.phone,
        url: `/phonedirectory`,
      })),
    ...workers
      .filter((w) => {
        const name = w.name.toLowerCase();
        const spec = (w.specialization ?? "").toLowerCase();
        const type = (w.type ?? "").toLowerCase();
        const phone = (w.phone ?? "").toLowerCase();
        const notes = (w.notes ?? "").toLowerCase();
        return name.includes(q) || spec.includes(q) || type.includes(q) || phone.includes(q) || notes.includes(q);
      })
      .map((w) => ({
        id: w.id,
        name: w.name,
        type: "WORKER" as const,
        badge: `👷 ${w.specialization ?? w.type}`,
        subtitle: w.phone ? `📱 ${w.phone}` : w.specialization ?? "Construction Worker",
        phone: w.phone,
        url: `/phonedirectory`,
      })),
  ].slice(0, 6);

  // 4. MATCHING STAGES (Canonical 20 Stages + DB stages)
  const matchedStages = CANONICAL_STAGES
    .filter((s) => {
      const name = s.name.toLowerCase();
      const short = s.shortName.toLowerCase();
      const kw = s.keywords.toLowerCase();
      return name.includes(q) || short.includes(q) || kw.includes(q) || `stage ${s.step}`.includes(q);
    })
    .slice(0, 4)
    .map((s) => {
      const dbStage = stages.find((st) => st.sortOrder === s.step);
      return {
        step: s.step,
        name: s.name,
        shortName: s.shortName,
        status: dbStage?.status ?? "IN_PROGRESS",
        percentage: dbStage?.percentageComplete ?? 0,
        url: `/stages/${s.step}`,
      };
    });

  // 5. MATCHING DOCUMENTS & BLUEPRINTS (Deep search in titles, descriptions, categories, file names, receipts)
  const matchedDocuments = [
    ...documents
      .filter((d) => {
        const title = d.title.toLowerCase();
        const desc = (d.description ?? "").toLowerCase();
        const cat = d.category.toLowerCase();
        const file = (d.fileName ?? "").toLowerCase();
        return title.includes(q) || desc.includes(q) || cat.includes(q) || file.includes(q);
      })
      .map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category.replaceAll("_", " "),
        url: `/documents`,
        fileName: d.fileName,
      })),
    ...receipts
      .filter((r) => {
        const file = (r.fileName ?? "").toLowerCase();
        const inv = (r.ocrInvoiceNumber ?? "").toLowerCase();
        const vendor = (r.ocrVendor ?? "").toLowerCase();
        const mat = (r.ocrMaterial ?? "").toLowerCase();
        return file.includes(q) || inv.includes(q) || vendor.includes(q) || mat.includes(q);
      })
      .map((r) => ({
        id: r.id,
        title: r.ocrVendor ? `Receipt: ${r.ocrVendor}` : `Bill Receipt #${r.ocrInvoiceNumber ?? r.id.slice(-6)}`,
        category: "RECEIPT / BILL",
        url: `/documents`,
        fileName: r.fileName,
      })),
  ].slice(0, 5);

  // 6. PAGE MENU TREE & SITEMAP NAVIGATION
  const fullMenuTree = [
    { title: "Dashboard / Financial Overview", url: "/dashboard", subtitle: "Project summary, budget pacing, KPIs & milestone cards", section: "Main Menu", keywords: "home dashboard overview summary analytics total spent variance pacing" },
    { title: "All Expenses & Bills Ledger", url: "/expenses", subtitle: "Itemized transaction passbook, receipts & filters", section: "Main Menu", keywords: "expenses bills all transactions passbook receipts payments history" },
    { title: "Record New Expense", url: "/expenses/new", subtitle: "Add material bill, labour wages or service payout", section: "Main Menu", keywords: "add expense new bill create record log camera scan receipt" },
    { title: "Construction Stages (20 Timeline Steps)", url: "/stages", subtitle: "Chronological 4-phase master timeline from foundation to handover", section: "Main Menu", keywords: "stages construction milestones foundation roof slab masonry timeline steps 20" },
    { title: "Budget Allocations & Spending Caps", url: "/budget", subtitle: "Overall ceiling, expense type caps & category budget limits", section: "Finance", keywords: "budget plans allocations ceiling target limit variance over budget" },
    { title: "Reports & PDF Statements", url: "/reports", subtitle: "Generate material, labour, vendor, worker & stage PDF reports", section: "Finance", keywords: "reports pdf statement export download whatsapp share print printout" },
    { title: "Phone Directory & UPI Pay", url: "/phonedirectory", subtitle: "Hardware vendors, masons, phone numbers, direct call & UPI pay", section: "Directory", keywords: "phone directory contacts shops vendors workers masons upi pay google pay phonepe" },
    { title: "Documents, Plans & Blueprints", url: "/documents", subtitle: "Architectural CAD drawings, structural plans & permits", section: "Documents", keywords: "documents plans blueprints cad permits sanction approval drawings 2d 3d pdf" },
    { title: "Inquiries & Customer Leads", url: "/leads", subtitle: "Prospective homeowner inquiries, quotes & estimates", section: "Management", keywords: "leads inquiries quotes estimates prospective customer client" },
    { title: "Account & House Settings", url: "/settings", subtitle: "Profile, passwords, multi-house project management", section: "Management", keywords: "settings account profile password house project switch logout" },
  ];

  const matchedNavigation = fullMenuTree
    .filter((n) => n.title.toLowerCase().includes(q) || n.keywords.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q))
    .slice(0, 4);

  return NextResponse.json({
    query: q,
    smartReport,
    expenses: matchedExpenses,
    contacts: matchedContacts,
    stages: matchedStages,
    documents: matchedDocuments,
    navigation: matchedNavigation,
  });
}
