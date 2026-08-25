import { Prisma, type ExpenseType, type LabourCalcMethod, type PaymentMethod, type WorkerType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { seedProjectStructure, seedUserMasters } from "../src/lib/catalog/seed-masters";

const DEMO_EMAIL = "admin";
const DEMO_PASSWORD = "test123";

function money(value: number) {
  return new Prisma.Decimal(value);
}

function onDay(month: number, day: number) {
  return new Date(Date.UTC(2026, month - 1, day));
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: "Admin", passwordHash },
    create: { email: DEMO_EMAIL, name: "Admin", passwordHash },
  });

  const oldUser = await prisma.user.findUnique({ where: { email: "demo@housetracker.app" } });
  if (oldUser) {
    await prisma.user.update({
      where: { email: "demo@housetracker.app" },
      data: { passwordHash },
    });
  }

  await seedUserMasters(user.id);

  const [materials, labours, services, equipment, professionals] = await Promise.all([
    prisma.materialCategory.findMany({ where: { userId: user.id } }),
    prisma.labourCategory.findMany({ where: { userId: user.id } }),
    prisma.serviceCategory.findMany({ where: { userId: user.id } }),
    prisma.equipmentCategory.findMany({ where: { userId: user.id } }),
    prisma.professionalCategory.findMany({ where: { userId: user.id } }),
  ]);

  const mat = (name: string, group?: string) => {
    const match = materials.find((row) => row.name === name && (!group || row.groupName === group));
    if (!match) throw new Error(`Missing material ${name}`);
    return match.id;
  };
  const lab = (name: string) => {
    const match = labours.find((row) => row.name === name);
    if (!match) throw new Error(`Missing labour ${name}`);
    return match.id;
  };
  const svc = (name: string) => services.find((row) => row.name === name)!.id;
  const eq = (name: string) => equipment.find((row) => row.name === name)!.id;
  const pro = (name: string) => professionals.find((row) => row.name === name)!.id;

  const vendors = await upsertVendors(user.id);
  const workers = await upsertWorkers(user.id);

  const project = await prisma.project.upsert({
    where: { id: "demo-whitefield-house" },
    update: { userId: user.id },
    create: {
      id: "demo-whitefield-house",
      userId: user.id,
      name: "Whitefield Residence",
      location: "Whitefield, Bengaluru",
      plotArea: money(2400),
      builtUpArea: money(2850),
      numberOfFloors: 2,
      startDate: onDay(3, 1),
      expectedCompletionDate: onDay(12, 15),
      totalBudget: money(40_00_000),
      status: "IN_PROGRESS",
      notes: "G+1 independent house with terrace sit-out and compound wall.",
    },
  });

  await seedProjectStructure(project.id, { demoProgress: true });

  const floors = await prisma.floor.findMany({ where: { projectId: project.id } });
  const stages = await prisma.constructionStage.findMany({ where: { projectId: project.id } });
  const floor = (name: string) => floors.find((row) => row.name === name)?.id;
  const stage = (name: string) => stages.find((row) => row.name === name)?.id;

  await prisma.expense.deleteMany({ where: { projectId: project.id } });
  await prisma.budget.deleteMany({ where: { projectId: project.id } });
  await prisma.budgetCategory.deleteMany({ where: { projectId: project.id } });

  await prisma.budget.createMany({
    data: [
      { projectId: project.id, expenseType: "MATERIAL", amount: money(25_00_000) },
      { projectId: project.id, expenseType: "LABOUR", amount: money(8_00_000) },
      { projectId: project.id, expenseType: "SERVICE", amount: money(3_00_000) },
      { projectId: project.id, expenseType: "EQUIPMENT", amount: money(80_000) },
      { projectId: project.id, expenseType: "PROFESSIONAL", amount: money(1_50_000) },
      { projectId: project.id, expenseType: "OTHER", amount: money(70_000) },
    ],
  });

  await prisma.budgetCategory.createMany({
    data: [
      { projectId: project.id, expenseType: "MATERIAL", materialCategoryId: mat("Steel / TMT"), amount: money(5_00_000) },
      { projectId: project.id, expenseType: "MATERIAL", materialCategoryId: mat("Cement", "Civil / Structural"), amount: money(3_00_000) },
      { projectId: project.id, expenseType: "MATERIAL", materialCategoryId: mat("Floor Tiles"), amount: money(1_50_000) },
      { projectId: project.id, expenseType: "MATERIAL", materialCategoryId: mat("Electrical Wire"), amount: money(3_00_000) },
      { projectId: project.id, expenseType: "LABOUR", labourCategoryId: lab("Floor Tile Laying"), amount: money(40_000) },
    ],
  });

  await prisma.projectDocument.deleteMany({ where: { projectId: project.id } });
  await prisma.projectDocument.createMany({
    data: [
      {
        projectId: project.id,
        category: "ELEVATION",
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
        projectId: project.id,
        category: "FLOOR_PLAN",
        title: "Ground & First Floor Architectural Working Plan",
        description: "Vastu compliant 4BHK architectural layout with car parking, pooja room, modular kitchen, and balconies.",
        fileName: "architectural_floor_plan_approved.pdf",
        storedName: "floor_plan.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024 * 1850,
        storagePath: "/images/stages/elevation.jpg",
        version: "v3.0 Final Sanctioned",
        isPinned: true,
      },
      {
        projectId: project.id,
        category: "STRUCTURAL",
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
        projectId: project.id,
        category: "STRUCTURAL",
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
        projectId: project.id,
        category: "MEP",
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
        projectId: project.id,
        category: "APPROVAL",
        title: "BBMP / Gram Panchayat Building Plan Sanction Permit",
        description: "Official municipal building permit LP no. 482/2026 with BESCOM electricity sanction and borewell clearance.",
        fileName: "bbmp_building_sanction_permit.pdf",
        storedName: "sanction_permit.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024 * 1200,
        storagePath: "/images/stages/elevation.jpg",
        version: "Official Sanction",
        isPinned: true,
      },
      {
        projectId: project.id,
        category: "SITE_PHOTO",
        title: "Site Footing Excavation & Concrete Pouring Progress",
        description: "Live photo taken at site during column footing concreting and vibrating.",
        fileName: "site_excavation_photo_aug.jpg",
        storedName: "foundation.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024 * 670,
        storagePath: "/images/stages/foundation.jpg",
        version: "Site August",
        isPinned: false,
      },
    ],
  });

  type Row = {
    month: number;
    day: number;
    type: ExpenseType;
    description: string;
    amount: number;
    qty?: number;
    unit?: string;
    rate?: number;
    material?: string;
    materialGroup?: string;
    labour?: string;
    service?: string;
    equipment?: string;
    professional?: string;
    vendor?: keyof typeof vendors;
    worker?: keyof typeof workers;
    stage?: string;
    floor?: string;
    pay?: PaymentMethod;
    invoice?: string;
    method?: LabourCalcMethod;
    workers?: number;
    days?: number;
  };

  const rows: Row[] = [
    { month: 3, day: 4, type: "PROFESSIONAL", professional: "Architect", description: "Architectural drawings and 3D views", amount: 85000, vendor: undefined, pay: "BANK_TRANSFER", stage: "Planning & Approvals" },
    { month: 3, day: 8, type: "PROFESSIONAL", professional: "Structural Engineer", description: "Structural design and drawings", amount: 45000, pay: "UPI", stage: "Planning & Approvals" },
    { month: 3, day: 12, type: "PROFESSIONAL", professional: "Plan Approval", description: "BBMP plan approval fees", amount: 28000, pay: "BANK_TRANSFER", stage: "Planning & Approvals" },
    { month: 3, day: 18, type: "PROFESSIONAL", professional: "Soil Testing", description: "Soil investigation report", amount: 12000, pay: "UPI", stage: "Planning & Approvals" },
    { month: 3, day: 22, type: "SERVICE", service: "Site Security", description: "Temporary site fencing", amount: 18500, pay: "CASH", stage: "Site Preparation", floor: "External" },
    { month: 3, day: 25, type: "SERVICE", service: "JCB", description: "Site clearing and excavation", amount: 24000, pay: "CASH", stage: "Excavation & Foundation", floor: "Basement" },
    { month: 3, day: 27, type: "LABOUR", labour: "Foundation Work", description: "Foundation excavation labour", amount: 36000, worker: "ramesh", method: "DAILY_WAGE", workers: 6, days: 6, rate: 1000, stage: "Excavation & Foundation", floor: "Basement", pay: "CASH" },
    { month: 3, day: 28, type: "MATERIAL", material: "PCC", description: "PCC mix for footings", amount: 42000, qty: 14, unit: "cum", rate: 3000, vendor: "ultratech", stage: "Excavation & Foundation", floor: "Basement", invoice: "UTC-3102" },
    { month: 4, day: 2, type: "MATERIAL", material: "Cement", materialGroup: "Civil / Structural", description: "OPC 53 grade cement", amount: 42000, qty: 100, unit: "bags", rate: 420, vendor: "balaji", stage: "Excavation & Foundation", floor: "Basement", invoice: "BAL-0402" },
    { month: 4, day: 3, type: "MATERIAL", material: "Steel / TMT", description: "TMT 500D 12mm / 16mm", amount: 185000, qty: 2500, unit: "kg", rate: 74, vendor: "jsw", stage: "RCC Structure", floor: "Basement", invoice: "JSW-4411" },
    { month: 4, day: 5, type: "MATERIAL", material: "Binding Wire", description: "Binding wire 1.2mm", amount: 6800, qty: 80, unit: "kg", rate: 85, vendor: "balaji", stage: "RCC Structure", floor: "Basement" },
    { month: 4, day: 6, type: "MATERIAL", material: "Shuttering Material", description: "Plywood shuttering sheets", amount: 54000, vendor: "woodland", stage: "RCC Structure", floor: "Basement", invoice: "WD-228" },
    { month: 4, day: 8, type: "LABOUR", labour: "RCC Work", description: "Footing and column RCC labour", amount: 72000, worker: "nataraj", method: "FIXED_CONTRACT", stage: "RCC Structure", floor: "Basement", pay: "BANK_TRANSFER" },
    { month: 4, day: 10, type: "SERVICE", service: "Tractor", description: "Murrum filling and compaction", amount: 16000, stage: "Excavation & Foundation", floor: "Basement", pay: "CASH" },
    { month: 4, day: 12, type: "MATERIAL", material: "Bricks", materialGroup: "Civil / Structural", description: "Table moulded bricks", amount: 78000, qty: 8000, unit: "nos", rate: 9.75, vendor: "brickworks", stage: "Masonry / Brickwork", floor: "Ground Floor", invoice: "BRK-119" },
    { month: 4, day: 15, type: "MATERIAL", material: "M-Sand", description: "M-sand for masonry", amount: 32000, qty: 16, unit: "units", rate: 2000, vendor: "sandco", stage: "Masonry / Brickwork", floor: "Ground Floor" },
    { month: 4, day: 16, type: "LABOUR", labour: "Brick Work", description: "Ground floor brick masonry", amount: 54000, worker: "ramesh", method: "DAILY_WAGE", workers: 6, days: 9, rate: 1000, stage: "Masonry / Brickwork", floor: "Ground Floor", pay: "CASH" },
    { month: 4, day: 18, type: "EQUIPMENT", equipment: "Mixer Rental", description: "Concrete mixer 10 days", amount: 12000, qty: 10, unit: "days", rate: 1200, stage: "RCC Structure", floor: "Ground Floor", pay: "UPI" },
    { month: 4, day: 22, type: "MATERIAL", material: "Ready Mix Concrete", description: "M20 RMC for plinth beam", amount: 96000, qty: 16, unit: "cum", rate: 6000, vendor: "ultratech", stage: "Plinth", floor: "Ground Floor", invoice: "UTC-4188" },
    { month: 4, day: 25, type: "LABOUR", labour: "Foundation Work", description: "Plinth beam labour", amount: 28000, worker: "nataraj", method: "WORK_BASED", stage: "Plinth", floor: "Ground Floor", pay: "UPI" },
    { month: 4, day: 28, type: "SERVICE", service: "Transport", description: "Steel and cement transport", amount: 8500, vendor: "jsw", stage: "Site Preparation", pay: "CASH" },
    { month: 5, day: 2, type: "MATERIAL", material: "Cement", materialGroup: "Civil / Structural", description: "OPC 53 grade cement", amount: 50400, qty: 120, unit: "bags", rate: 420, vendor: "balaji", stage: "RCC Structure", floor: "Ground Floor", invoice: "BAL-0502" },
    { month: 5, day: 4, type: "MATERIAL", material: "Steel / TMT", description: "TMT 500D 8mm / 10mm / 20mm", amount: 210000, qty: 2800, unit: "kg", rate: 75, vendor: "jsw", stage: "RCC Structure", floor: "Ground Floor", invoice: "JSW-5091" },
    { month: 5, day: 6, type: "MATERIAL", material: "Aggregate", description: "20mm jelly", amount: 27000, qty: 18, unit: "units", rate: 1500, vendor: "sandco", stage: "RCC Structure", floor: "Ground Floor" },
    { month: 5, day: 8, type: "LABOUR", labour: "RCC Work", description: "Ground floor slab labour", amount: 88000, worker: "nataraj", method: "FIXED_CONTRACT", stage: "Roofing / Slab", floor: "Ground Floor", pay: "BANK_TRANSFER" },
    { month: 5, day: 10, type: "EQUIPMENT", equipment: "Scaffolding", description: "Scaffolding rental", amount: 18500, stage: "RCC Structure", floor: "First Floor", pay: "UPI" },
    { month: 5, day: 12, type: "MATERIAL", material: "AAC Blocks", description: "AAC blocks 600x200x200", amount: 64000, qty: 800, unit: "nos", rate: 80, vendor: "brickworks", stage: "Masonry / Brickwork", floor: "First Floor", invoice: "BRK-204" },
    { month: 5, day: 14, type: "LABOUR", labour: "Block Work", description: "First floor AAC block work", amount: 42000, worker: "ramesh", method: "DAILY_WAGE", workers: 5, days: 7, rate: 1200, stage: "Masonry / Brickwork", floor: "First Floor", pay: "CASH" },
    { month: 5, day: 16, type: "MATERIAL", material: "River Sand", description: "River sand for plaster", amount: 24000, qty: 8, unit: "units", rate: 3000, vendor: "sandco", stage: "Plastering", floor: "Ground Floor" },
    { month: 5, day: 18, type: "SERVICE", service: "Water Tanker", description: "Curing water", amount: 7500, stage: "RCC Structure", pay: "CASH" },
    { month: 5, day: 20, type: "MATERIAL", material: "Construction Chemicals", description: "Plasticizer and curing compound", amount: 9800, vendor: "ultratech", stage: "RCC Structure", floor: "Ground Floor" },
    { month: 5, day: 22, type: "LABOUR", labour: "Helper", description: "Site helpers for curing", amount: 18000, worker: "suresh", method: "DAILY_WAGE", workers: 3, days: 10, rate: 600, stage: "RCC Structure", floor: "Ground Floor", pay: "CASH" },
    { month: 5, day: 25, type: "MATERIAL", material: "Cement", materialGroup: "RCC / Roofing", description: "Cement for first floor slab", amount: 37800, qty: 90, unit: "bags", rate: 420, vendor: "balaji", stage: "Roofing / Slab", floor: "First Floor", invoice: "BAL-0525" },
    { month: 5, day: 28, type: "SERVICE", service: "JCB", description: "Backfilling around foundation", amount: 14000, stage: "Excavation & Foundation", floor: "External", pay: "CASH" },
    { month: 6, day: 2, type: "MATERIAL", material: "Steel / TMT", description: "TMT for first floor slab", amount: 156000, qty: 2000, unit: "kg", rate: 78, vendor: "jsw", stage: "Roofing / Slab", floor: "First Floor", invoice: "JSW-6102" },
    { month: 6, day: 4, type: "LABOUR", labour: "RCC Work", description: "First floor slab labour", amount: 76000, worker: "nataraj", method: "FIXED_CONTRACT", stage: "Roofing / Slab", floor: "First Floor", pay: "BANK_TRANSFER" },
    { month: 6, day: 6, type: "MATERIAL", material: "Waterproofing", materialGroup: "RCC / Roofing", description: "Terrace waterproofing chemical", amount: 22000, vendor: "ultratech", stage: "Waterproofing", floor: "Terrace", invoice: "UTC-609" },
    { month: 6, day: 8, type: "LABOUR", labour: "Plastering", description: "Internal plastering ground floor", amount: 64000, worker: "ramesh", method: "DAILY_WAGE", workers: 8, days: 8, rate: 1000, stage: "Plastering", floor: "Ground Floor", pay: "CASH" },
    { month: 6, day: 10, type: "MATERIAL", material: "Plastering Materials", description: "Putty sand and chicken mesh", amount: 14500, vendor: "balaji", stage: "Plastering", floor: "Ground Floor" },
    { month: 6, day: 12, type: "MATERIAL", material: "CPVC", description: "Ashirvad CPVC pipes and fittings", amount: 28500, vendor: "plumbmart", stage: "Plumbing Rough-in", floor: "Ground Floor", invoice: "PLB-331" },
    { month: 6, day: 13, type: "LABOUR", labour: "Pipe Work", description: "Concealed plumbing rough-in", amount: 32000, worker: "imran", method: "FIXED_CONTRACT", stage: "Plumbing Rough-in", floor: "Ground Floor", pay: "UPI" },
    { month: 6, day: 15, type: "MATERIAL", material: "Electrical Wire", description: "Finolex 1.5 / 2.5 / 4 sq mm", amount: 42000, vendor: "electroworld", stage: "Electrical Rough-in", floor: "Ground Floor", invoice: "EL-778" },
    { month: 6, day: 16, type: "MATERIAL", material: "Conduit", description: "ISI PVC conduit and boxes", amount: 9800, vendor: "electroworld", stage: "Electrical Rough-in", floor: "Ground Floor" },
    { month: 6, day: 18, type: "LABOUR", labour: "Wiring", description: "Concealed wiring ground floor", amount: 38000, worker: "prasad", method: "FIXED_CONTRACT", stage: "Electrical Rough-in", floor: "Ground Floor", pay: "UPI" },
    { month: 6, day: 20, type: "SERVICE", service: "Waste Removal", description: "Debris clearance after plaster", amount: 6500, stage: "Plastering", floor: "External", pay: "CASH" },
    { month: 6, day: 22, type: "MATERIAL", material: "Door Frames", description: "Teak door frames", amount: 72000, vendor: "woodland", stage: "Doors & Windows", floor: "Ground Floor", invoice: "WD-401" },
    { month: 6, day: 24, type: "LABOUR", labour: "Door Work", description: "Door frame fixing", amount: 18000, worker: "ganesh", method: "WORK_BASED", stage: "Doors & Windows", floor: "Ground Floor", pay: "CASH" },
    { month: 6, day: 26, type: "MATERIAL", material: "UPVC", description: "UPVC sliding windows", amount: 125000, vendor: "fenesta", stage: "Doors & Windows", floor: "Ground Floor", invoice: "FEN-226" },
    { month: 6, day: 28, type: "EQUIPMENT", equipment: "Cutting Machine Rental", description: "Tile cutter advance rental", amount: 3500, stage: "Flooring & Tiling", pay: "UPI" },
    { month: 7, day: 2, type: "MATERIAL", material: "Floor Tiles", description: "Kajaria 600x600 vitrified", amount: 148000, qty: 1850, unit: "sqft", rate: 80, vendor: "kajaria", stage: "Flooring & Tiling", floor: "Ground Floor", invoice: "KAJ-702" },
    { month: 7, day: 3, type: "MATERIAL", material: "Tile Adhesive", description: "Weber tile adhesive", amount: 18500, vendor: "kajaria", stage: "Flooring & Tiling", floor: "Ground Floor" },
    { month: 7, day: 4, type: "LABOUR", labour: "Floor Tile Laying", description: "Ground floor tile laying", amount: 42000, worker: "manjunath", method: "DAILY_WAGE", workers: 5, days: 7, rate: 1200, stage: "Flooring & Tiling", floor: "Ground Floor", pay: "CASH" },
    { month: 7, day: 6, type: "MATERIAL", material: "Wall Tiles", description: "Bathroom ceramic wall tiles", amount: 62000, vendor: "kajaria", stage: "Flooring & Tiling", floor: "Ground Floor", invoice: "KAJ-718" },
    { month: 7, day: 8, type: "LABOUR", labour: "Bathroom Tile Work", description: "Bathroom wall tiling", amount: 28000, worker: "manjunath", method: "WORK_BASED", stage: "Flooring & Tiling", floor: "Ground Floor", pay: "UPI" },
    { month: 7, day: 10, type: "MATERIAL", material: "Plywood", description: "BWP plywood for kitchen", amount: 54000, vendor: "woodland", stage: "Woodwork / Interior", floor: "Ground Floor", invoice: "WD-512" },
    { month: 7, day: 12, type: "MATERIAL", material: "Modular Kitchen Materials", description: "Hardware, baskets and laminate", amount: 38000, vendor: "woodland", stage: "Woodwork / Interior", floor: "Ground Floor" },
    { month: 7, day: 14, type: "LABOUR", labour: "Modular Kitchen", description: "Modular kitchen fabrication", amount: 45000, worker: "ganesh", method: "FIXED_CONTRACT", stage: "Woodwork / Interior", floor: "Ground Floor", pay: "BANK_TRANSFER" },
    { month: 7, day: 16, type: "MATERIAL", material: "MS Material", description: "MS flats and squares for grills", amount: 32000, vendor: "jsw", stage: "Grills / Railings", floor: "Ground Floor", invoice: "JSW-7716" },
    { month: 7, day: 18, type: "LABOUR", labour: "Window Grills", description: "Window grill fabrication and fixing", amount: 24000, worker: "akbar", method: "FIXED_CONTRACT", stage: "Grills / Railings", floor: "Ground Floor", pay: "CASH" },
    { month: 7, day: 20, type: "MATERIAL", material: "Interior Paint", description: "Asian Royale interior paint", amount: 28600, vendor: "asianpaints", stage: "Painting", floor: "Ground Floor", invoice: "AP-334" },
    { month: 7, day: 21, type: "MATERIAL", material: "Putty", description: "Birla wall care putty", amount: 9200, vendor: "asianpaints", stage: "Painting", floor: "Ground Floor" },
    { month: 7, day: 22, type: "LABOUR", labour: "Interior Painting", description: "Ground floor interior painting", amount: 36000, worker: "joseph", method: "DAILY_WAGE", workers: 4, days: 9, rate: 1000, stage: "Painting", floor: "Ground Floor", pay: "CASH" },
    { month: 7, day: 24, type: "MATERIAL", material: "Switches", description: "Legrand myrius switches", amount: 18500, vendor: "electroworld", stage: "Electrical Fixtures", floor: "Ground Floor", invoice: "EL-824" },
    { month: 7, day: 26, type: "LABOUR", labour: "Switch Installation", description: "Switchboard installation", amount: 12000, worker: "prasad", method: "WORK_BASED", stage: "Electrical Fixtures", floor: "Ground Floor", pay: "UPI" },
    { month: 7, day: 28, type: "SERVICE", service: "Borewell", description: "Borewell drilling 180ft", amount: 48000, stage: "External Development", floor: "External", pay: "BANK_TRANSFER" },
    { month: 8, day: 1, type: "MATERIAL", material: "Floor Tiles", description: "Kajaria first floor tiles", amount: 62000, vendor: "kajaria", stage: "Flooring & Tiling", floor: "First Floor", invoice: "KAJ-801" },
    { month: 8, day: 2, type: "LABOUR", labour: "Floor Tile Laying", description: "First floor tile laying", amount: 18000, worker: "manjunath", method: "DAILY_WAGE", workers: 4, days: 5, rate: 900, stage: "Flooring & Tiling", floor: "First Floor", pay: "CASH" },
    { month: 8, day: 3, type: "MATERIAL", material: "Granite", description: "Steel grey granite kitchen", amount: 48000, vendor: "kajaria", stage: "Flooring & Tiling", floor: "Ground Floor", invoice: "KAJ-803" },
    { month: 8, day: 4, type: "LABOUR", labour: "Granite Work", description: "Kitchen granite fixing", amount: 14000, worker: "manjunath", method: "WORK_BASED", stage: "Flooring & Tiling", floor: "Ground Floor", pay: "UPI" },
    { month: 8, day: 5, type: "MATERIAL", material: "Main Door", description: "Teak main door with brass fittings", amount: 68000, vendor: "woodland", stage: "Doors & Windows", floor: "Ground Floor", invoice: "WD-805" },
    { month: 8, day: 6, type: "LABOUR", labour: "Door Work", description: "Main door hanging and polish", amount: 12500, worker: "ganesh", method: "FIXED_CONTRACT", stage: "Doors & Windows", floor: "Ground Floor", pay: "CASH" },
    { month: 8, day: 7, type: "MATERIAL", material: "Main Gate", description: "MS main gate with design", amount: 38000, vendor: "jsw", stage: "Grills / Railings", floor: "External", invoice: "JSW-807" },
    { month: 8, day: 8, type: "LABOUR", labour: "Main Gate", description: "Main gate fabrication and install", amount: 18000, worker: "akbar", method: "FIXED_CONTRACT", stage: "Grills / Railings", floor: "External", pay: "UPI" },
    { month: 8, day: 9, type: "MATERIAL", material: "Electrical Wire", description: "First floor wiring cables", amount: 26500, vendor: "electroworld", stage: "Electrical Rough-in", floor: "First Floor", invoice: "EL-809" },
    { month: 8, day: 10, type: "LABOUR", labour: "Wiring", description: "First floor concealed wiring", amount: 22000, worker: "prasad", method: "FIXED_CONTRACT", stage: "Electrical Rough-in", floor: "First Floor", pay: "UPI" },
    { month: 8, day: 11, type: "MATERIAL", material: "Light Fixtures", description: "LED panels and downlights", amount: 24000, vendor: "electroworld", stage: "Electrical Fixtures", floor: "Ground Floor" },
    { month: 8, day: 12, type: "MATERIAL", material: "Fans", description: "Crompton ceiling fans", amount: 16800, vendor: "electroworld", stage: "Electrical Fixtures", floor: "First Floor" },
    { month: 8, day: 13, type: "LABOUR", labour: "Lighting Installation", description: "Fixture and fan installation", amount: 8500, worker: "prasad", method: "WORK_BASED", stage: "Electrical Fixtures", pay: "CASH" },
    { month: 8, day: 14, type: "MATERIAL", material: "Sanitaryware", description: "Jaquar WC and cistern", amount: 32000, vendor: "plumbmart", stage: "Plumbing Fixtures", floor: "Ground Floor", invoice: "PLB-814" },
    { month: 8, day: 15, type: "MATERIAL", material: "Taps", description: "Jaquar mixer and health faucet", amount: 18500, vendor: "plumbmart", stage: "Plumbing Fixtures", floor: "Ground Floor" },
    { month: 8, day: 16, type: "LABOUR", labour: "Sanitaryware Installation", description: "Bathroom fixture installation", amount: 14000, worker: "imran", method: "FIXED_CONTRACT", stage: "Plumbing Fixtures", floor: "Ground Floor", pay: "UPI" },
    { month: 8, day: 17, type: "MATERIAL", material: "Water Tank", description: "Sintex 2000L overhead tank", amount: 14500, vendor: "plumbmart", stage: "Plumbing Fixtures", floor: "Terrace" },
    { month: 8, day: 18, type: "LABOUR", labour: "Water Tank", description: "Overhead tank plumbing", amount: 8000, worker: "imran", method: "WORK_BASED", stage: "Plumbing Fixtures", floor: "Terrace", pay: "CASH" },
    { month: 8, day: 19, type: "MATERIAL", material: "Exterior Paint", description: "Apex Ultima exterior", amount: 24600, vendor: "asianpaints", stage: "Painting", floor: "External", invoice: "AP-819" },
    { month: 8, day: 20, type: "LABOUR", labour: "Exterior Painting", description: "External painting first coat", amount: 28000, worker: "joseph", method: "DAILY_WAGE", workers: 5, days: 7, rate: 800, stage: "Painting", floor: "External", pay: "CASH" },
    { month: 8, day: 21, type: "MATERIAL", material: "Staircase Railing", description: "SS staircase railing material", amount: 27000, vendor: "jsw", stage: "Grills / Railings", floor: "First Floor" },
    { month: 8, day: 22, type: "LABOUR", labour: "Staircase Railing", description: "SS railing fabrication", amount: 15000, worker: "akbar", method: "FIXED_CONTRACT", stage: "Grills / Railings", floor: "First Floor", pay: "UPI" },
    { month: 8, day: 23, type: "OTHER", description: "Tea, snacks and site miscellaneous", amount: 4200, stage: "Final Finishing", pay: "CASH" },
    { month: 8, day: 24, type: "SERVICE", service: "Loading / Unloading", description: "Tile and granite unloading", amount: 3500, stage: "Flooring & Tiling", pay: "CASH" },
    { month: 4, day: 7, type: "MATERIAL", material: "Footing", description: "Footing extra concrete", amount: 18000, vendor: "ultratech", stage: "Excavation & Foundation", floor: "Basement" },
    { month: 4, day: 20, type: "MATERIAL", material: "Plinth", description: "Plinth filling and PCC", amount: 26500, vendor: "sandco", stage: "Plinth", floor: "Ground Floor" },
    { month: 5, day: 9, type: "LABOUR", labour: "Cement Work", description: "Column and lintel masonry", amount: 22000, worker: "ramesh", method: "DAILY_WAGE", workers: 4, days: 5, rate: 1100, stage: "Masonry / Brickwork", floor: "Ground Floor", pay: "CASH" },
    { month: 5, day: 15, type: "MATERIAL", material: "Lintel Materials", description: "Lintel and sunshade concrete extras", amount: 16000, vendor: "balaji", stage: "Masonry / Brickwork", floor: "First Floor" },
    { month: 6, day: 5, type: "LABOUR", labour: "General Masonry", description: "Sill and loft masonry", amount: 15000, worker: "ramesh", method: "WORK_BASED", stage: "Masonry / Brickwork", floor: "First Floor", pay: "CASH" },
    { month: 6, day: 14, type: "MATERIAL", material: "PVC", description: "Drainage PVC pipes", amount: 11200, vendor: "plumbmart", stage: "Plumbing Rough-in", floor: "Ground Floor" },
    { month: 6, day: 17, type: "LABOUR", labour: "Drainage", description: "External drainage line", amount: 9000, worker: "imran", method: "WORK_BASED", stage: "Plumbing Rough-in", floor: "External", pay: "CASH" },
    { month: 6, day: 19, type: "MATERIAL", material: "MCB", description: "Havells MCB and isolators", amount: 7800, vendor: "electroworld", stage: "Electrical Rough-in", floor: "Ground Floor" },
    { month: 6, day: 21, type: "MATERIAL", material: "Distribution Board", description: "12-way DB double door", amount: 6200, vendor: "electroworld", stage: "Electrical Rough-in", floor: "Ground Floor" },
    { month: 7, day: 5, type: "MATERIAL", material: "Grout", description: "Epoxy grout", amount: 5400, vendor: "kajaria", stage: "Flooring & Tiling", floor: "Ground Floor" },
    { month: 7, day: 7, type: "LABOUR", labour: "Skirting", description: "Tile skirting labour", amount: 6500, worker: "manjunath", method: "WORK_BASED", stage: "Flooring & Tiling", floor: "Ground Floor", pay: "CASH" },
    { month: 7, day: 11, type: "MATERIAL", material: "Teak", description: "Teak for window frames leftover", amount: 21000, vendor: "woodland", stage: "Woodwork / Interior", floor: "First Floor" },
    { month: 7, day: 13, type: "LABOUR", labour: "Carpentry", description: "Loft shutters and frames", amount: 19500, worker: "ganesh", method: "DAILY_WAGE", workers: 3, days: 5, rate: 1300, stage: "Woodwork / Interior", floor: "First Floor", pay: "CASH" },
    { month: 7, day: 17, type: "MATERIAL", material: "Window Grills", description: "MS grill extra sections", amount: 8600, vendor: "jsw", stage: "Grills / Railings", floor: "First Floor" },
    { month: 7, day: 19, type: "LABOUR", labour: "MS Fabrication", description: "Balcony grill welding", amount: 11000, worker: "akbar", method: "WORK_BASED", stage: "Grills / Railings", floor: "First Floor", pay: "CASH" },
    { month: 7, day: 23, type: "MATERIAL", material: "Primer", description: "Asian primer 20L", amount: 4800, vendor: "asianpaints", stage: "Painting", floor: "Ground Floor" },
    { month: 7, day: 25, type: "LABOUR", labour: "Putty", description: "Wall putty labour", amount: 16000, worker: "joseph", method: "DAILY_WAGE", workers: 4, days: 5, rate: 800, stage: "Painting", floor: "First Floor", pay: "CASH" },
    { month: 8, day: 25, type: "MATERIAL", material: "Kitchen Sink", description: "Nirali steel sink", amount: 7200, vendor: "plumbmart", stage: "Plumbing Fixtures", floor: "Ground Floor" },
    { month: 8, day: 25, type: "LABOUR", labour: "Kitchen Plumbing", description: "Sink and geyser plumbing", amount: 6500, worker: "imran", method: "WORK_BASED", stage: "Plumbing Fixtures", floor: "Ground Floor", pay: "UPI" },
    { month: 3, day: 15, type: "PROFESSIONAL", professional: "Surveyor", description: "Site survey and marking", amount: 8000, stage: "Planning & Approvals", pay: "UPI" },
    { month: 4, day: 14, type: "SERVICE", service: "Excavator", description: "Mini excavator for soak pit", amount: 9500, stage: "Excavation & Foundation", floor: "External", pay: "CASH" },
    { month: 5, day: 27, type: "OTHER", description: "Temple pooja and site opening", amount: 3500, stage: "Site Preparation", pay: "CASH" },
    { month: 6, day: 27, type: "EQUIPMENT", equipment: "Vibrator", description: "Needle vibrator hire", amount: 2800, stage: "RCC Structure", floor: "First Floor", pay: "UPI" },
    { month: 8, day: 24, type: "MATERIAL", material: "CCTV", description: "4-camera CCTV kit", amount: 18500, vendor: "electroworld", stage: "Electrical Fixtures", floor: "External", invoice: "EL-824B" },
    { month: 8, day: 24, type: "LABOUR", labour: "CCTV Installation", description: "CCTV cabling and setup", amount: 4500, worker: "prasad", method: "WORK_BASED", stage: "Electrical Fixtures", floor: "External", pay: "UPI" },
  ];

  for (const row of rows) {
    const quantity = row.qty != null ? money(row.qty) : row.workers != null ? money(row.workers) : null;
    const rate = row.rate != null ? money(row.rate) : null;
    await prisma.expense.create({
      data: {
        projectId: project.id,
        date: onDay(row.month, row.day),
        expenseType: row.type,
        description: row.description,
        quantity,
        unit: row.unit,
        rate,
        amount: money(row.amount),
        materialCategoryId: row.material ? mat(row.material, row.materialGroup) : null,
        labourCategoryId: row.labour ? lab(row.labour) : null,
        serviceCategoryId: row.service ? svc(row.service) : null,
        equipmentCategoryId: row.equipment ? eq(row.equipment) : null,
        professionalCategoryId: row.professional ? pro(row.professional) : null,
        vendorId: row.vendor ? vendors[row.vendor] : null,
        workerId: row.worker ? workers[row.worker] : null,
        constructionStageId: row.stage ? stage(row.stage) : null,
        floorId: row.floor ? floor(row.floor) : null,
        paymentMethod: row.pay ?? "UPI",
        invoiceNumber: row.invoice,
        labourCalcMethod: row.method,
        numberOfWorkers: row.workers,
        numberOfDays: row.days != null ? money(row.days) : null,
      },
    });
  }

  const count = await prisma.expense.count({ where: { projectId: project.id } });
  console.log(`Seeded ${count} expenses for ${project.name}`);
  console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

async function upsertVendors(userId: string) {
  const data = [
    { key: "balaji", name: "Sri Balaji Steels & Cement", company: "Balaji Traders", phone: "9845011122", address: "Whitefield Main Road, Bengaluru" },
    { key: "jsw", name: "JSW Steel Depot", company: "JSW", phone: "9845022233", address: "Hoskote, Bengaluru" },
    { key: "ultratech", name: "UltraTech Building Solutions", company: "UltraTech", phone: "9845033344", address: "Mahadevapura, Bengaluru" },
    { key: "brickworks", name: "Malur Brick Works", company: "Malur Bricks", phone: "9845044455", address: "Malur, Kolar" },
    { key: "sandco", name: "Kaveri Sand & Aggregate", company: "Kaveri Materials", phone: "9845055566", address: "Hosakote Taluk" },
    { key: "woodland", name: "Woodland Interiors", company: "Woodland", phone: "9845066677", address: "Tavarekere, Bengaluru" },
    { key: "kajaria", name: "Kajaria Galaxy Tiles", company: "Galaxy Ceramics", phone: "9845077788", address: "Old Madras Road, Bengaluru" },
    { key: "electroworld", name: "ElectroWorld", company: "ElectroWorld Pvt Ltd", phone: "9845088899", address: "SP Road, Bengaluru" },
    { key: "plumbmart", name: "PlumbMart Sanitary", company: "PlumbMart", phone: "9845099900", address: "KR Puram, Bengaluru" },
    { key: "asianpaints", name: "ColourHome Paints", company: "Asian Paints Dealer", phone: "9845000011", address: "Whitefield, Bengaluru" },
    { key: "fenesta", name: "Fenesta Windows", company: "DCM Shriram", phone: "9845001122", address: "Indiranagar, Bengaluru" },
  ] as const;

  const ids: Record<string, string> = {};
  for (const vendor of data) {
    const existing = await prisma.vendor.findFirst({ where: { userId, name: vendor.name } });
    const row =
      existing ??
      (await prisma.vendor.create({
        data: {
          userId,
          name: vendor.name,
          company: vendor.company,
          phone: vendor.phone,
          address: vendor.address,
        },
      }));
    ids[vendor.key] = row.id;
  }
  return ids as Record<(typeof data)[number]["key"], string>;
}

async function upsertWorkers(userId: string) {
  const data: { key: string; name: string; type: WorkerType; specialization: string; phone: string }[] = [
    { key: "ramesh", name: "Ramesh Mason", type: "MASON", specialization: "Brick and plaster", phone: "9900011101" },
    { key: "nataraj", name: "Nataraj RCC Contractor", type: "CONTRACTOR", specialization: "RCC and shuttering", phone: "9900011102" },
    { key: "manjunath", name: "Manjunath Tiles", type: "TILE_WORKER", specialization: "Floor and wall tiles", phone: "9900011103" },
    { key: "ganesh", name: "Ganesh Carpenter", type: "CARPENTER", specialization: "Doors and kitchen", phone: "9900011104" },
    { key: "akbar", name: "Akbar Fabricator", type: "FABRICATOR", specialization: "MS and SS fabrication", phone: "9900011105" },
    { key: "prasad", name: "Prasad Electrician", type: "ELECTRICIAN", specialization: "House wiring", phone: "9900011106" },
    { key: "imran", name: "Imran Plumber", type: "PLUMBER", specialization: "CPVC and sanitary", phone: "9900011107" },
    { key: "joseph", name: "Joseph Painter", type: "PAINTER", specialization: "Interior and exterior", phone: "9900011108" },
    { key: "suresh", name: "Suresh", type: "GENERAL_LABOUR", specialization: "Site helper", phone: "9900011109" },
  ];

  const ids: Record<string, string> = {};
  for (const worker of data) {
    const existing = await prisma.worker.findFirst({ where: { userId, name: worker.name } });
    const row =
      existing ??
      (await prisma.worker.create({
        data: {
          userId,
          name: worker.name,
          type: worker.type,
          specialization: worker.specialization,
          phone: worker.phone,
        },
      }));
    ids[worker.key] = row.id;
  }
  return ids as Record<(typeof data)[number]["key"], string>;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
