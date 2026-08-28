import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (dbUrl) {
  try {
    const urlObj = new URL(dbUrl);
    if (!urlObj.searchParams.has("connection_limit")) {
      urlObj.searchParams.set("connection_limit", "15");
    }
    if (!urlObj.searchParams.has("pool_timeout")) {
      urlObj.searchParams.set("pool_timeout", "10");
    }
    if (dbUrl.includes("-pooler.") && !urlObj.searchParams.has("pgbouncer")) {
      urlObj.searchParams.set("pgbouncer", "true");
    }
    dbUrl = urlObj.toString();
  } catch {
    // URL parsing fallback
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(dbUrl ? { datasourceUrl: dbUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Always reuse client across warm serverless invocations on Vercel
globalForPrisma.prisma = prisma;
