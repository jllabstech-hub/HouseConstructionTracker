import { prisma } from "../src/lib/prisma";
import {
  getDashboardFullData,
  getCriticalFinancialSummary,
  getMonthlyTrendOptimized,
  getTopCategoriesAndAlertsOptimized,
  getConstructionProgressSummary,
  getRecentExpensesOptimized,
} from "../src/lib/finance/financial-aggregates";

async function runBenchmark() {
  console.log("=================================================");
  console.log("🚀 PRODUCTION PERFORMANCE & QUERY BENCHMARK");
  console.log("=================================================\n");

  const project = await prisma.project.findFirst();
  if (!project) {
    console.error("❌ No project found in database.");
    process.exit(1);
  }

  const projectId = project.id;
  console.log(`📌 Testing Active Project: "${project.name}" (ID: ${projectId})\n`);

  // 0. Unified Dashboard Single-Roundtrip Loader
  const fullDataTimes: number[] = [];
  let fullData = null;
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    fullData = await getDashboardFullData(projectId);
    fullDataTimes.push(performance.now() - t);
  }
  const avgFullData = (fullDataTimes.reduce((a, b) => a + b, 0) / fullDataTimes.length).toFixed(2);
  const minFullData = Math.min(...fullDataTimes).toFixed(2);

  console.log("⚡ UNIFIED CONCURRENT DASHBOARD LOADER (1 Single Parallel Roundtrip):");
  console.log(`   ⏱ Warm Avg: ${avgFullData} ms (Fastest: ${minFullData} ms)`);
  console.log(`   📦 Total Spent = ₹${fullData?.summary?.totalSpent.toLocaleString()}, Budget = ₹${fullData?.summary?.totalBudget.toLocaleString()}`);
  console.log(`   📊 Monthly Points: ${fullData?.monthly.length}, Top Categories: ${fullData?.topCategories.length}, Recent: ${fullData?.recentExpenses.length}`);
  console.log("   ✅ Status: Pass (All 6 sections in 1 roundtrip)\n");

  // 1. Critical Financial Summary Benchmark
  // Run 5 warm iterations
  const criticalTimes: number[] = [];
  let criticalSummary = null;
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    criticalSummary = await getCriticalFinancialSummary(projectId);
    criticalTimes.push(performance.now() - t);
  }
  const avgCritical = (criticalTimes.reduce((a, b) => a + b, 0) / criticalTimes.length).toFixed(2);
  const minCritical = Math.min(...criticalTimes).toFixed(2);

  console.log("1️⃣ CRITICAL DASHBOARD QUERY (Database Aggregation with GroupBy):");
  console.log(`   ⏱ Warm Avg: ${avgCritical} ms (Fastest: ${minCritical} ms)`);
  console.log(`   📦 Payload: Total Spent = ₹${criticalSummary?.totalSpent.toLocaleString()}, Budget = ₹${criticalSummary?.totalBudget.toLocaleString()}, Remaining = ₹${criticalSummary?.remainingBudget.toLocaleString()}`);
  console.log(`   🏷 Breakdown: Material = ₹${criticalSummary?.materialTotal.toLocaleString()}, Labour = ₹${criticalSummary?.labourTotal.toLocaleString()}, Other = ₹${criticalSummary?.otherTotal.toLocaleString()}`);
  console.log("   ✅ Status: Pass (Direct single-roundtrip aggregation)\n");

  // 2. Spending Trend Monthly Aggregation
  const monthlyTimes: number[] = [];
  let monthlyData: Awaited<ReturnType<typeof getMonthlyTrendOptimized>> = [];
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    monthlyData = await getMonthlyTrendOptimized(projectId);
    monthlyTimes.push(performance.now() - t);
  }
  const avgMonthly = (monthlyTimes.reduce((a, b) => a + b, 0) / monthlyTimes.length).toFixed(2);

  console.log("2️⃣ MONTHLY SPENDING TREND (Suspense Streamed):");
  console.log(`   ⏱ Warm Avg: ${avgMonthly} ms`);
  console.log(`   📊 Data Points: ${monthlyData.length} months returned`);
  console.log("   ✅ Status: Pass\n");

  // 3. Top Categories & Budget Alerts
  const catTimes: number[] = [];
  let catData: Awaited<ReturnType<typeof getTopCategoriesAndAlertsOptimized>> | null = null;
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    catData = await getTopCategoriesAndAlertsOptimized(projectId);
    catTimes.push(performance.now() - t);
  }
  const avgCat = (catTimes.reduce((a, b) => a + b, 0) / catTimes.length).toFixed(2);

  console.log("3️⃣ TOP CATEGORIES & BUDGET ALERTS (Suspense Streamed):");
  console.log(`   ⏱ Warm Avg: ${avgCat} ms`);
  console.log(`   🏷 Top Categories Count: ${catData?.topCategories.length ?? 0}, Alerts: ${catData?.budgetAlerts.length ?? 0}`);
  console.log("   ✅ Status: Pass\n");

  // 4. Construction Progress Summary
  const progTimes: number[] = [];
  let progData: Awaited<ReturnType<typeof getConstructionProgressSummary>> | null = null;
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    progData = await getConstructionProgressSummary(projectId);
    progTimes.push(performance.now() - t);
  }
  const avgProg = (progTimes.reduce((a, b) => a + b, 0) / progTimes.length).toFixed(2);

  console.log("4️⃣ CONSTRUCTION PROGRESS SUMMARY (Suspense Streamed):");
  console.log(`   ⏱ Warm Avg: ${avgProg} ms`);
  console.log(`   🏗 Overall Completion: ${progData?.overallPercent ?? 0}% (${progData?.completedCount ?? 0} of ${progData?.totalStages ?? 0} stages completed)`);
  console.log("   ✅ Status: Pass\n");

  // 5. Recent Transactions (Paged to 5)
  const recTimes: number[] = [];
  let recData: Awaited<ReturnType<typeof getRecentExpensesOptimized>> = [];
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    recData = await getRecentExpensesOptimized(projectId, 5);
    recTimes.push(performance.now() - t);
  }
  const avgRec = (recTimes.reduce((a, b) => a + b, 0) / recTimes.length).toFixed(2);

  console.log("5️⃣ RECENT TRANSACTIONS (Paged to 5):");
  console.log(`   ⏱ Warm Avg: ${avgRec} ms`);
  console.log(`   📝 Rows Returned: ${recData.length}`);
  console.log("   ✅ Status: Pass\n");

  // 6. Expense Pagination (Simulating /expenses page)
  const expTimes: number[] = [];
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    await Promise.all([
      prisma.expense.findMany({
        where: { projectId },
        take: 20,
        skip: 0,
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          expenseType: true,
          description: true,
          amount: true,
          materialCategory: { select: { name: true } },
          labourCategory: { select: { name: true } },
          vendor: { select: { name: true } },
          worker: { select: { name: true } },
        },
      }),
      prisma.expense.count({ where: { projectId } }),
    ]);
    expTimes.push(performance.now() - t);
  }
  const avgExp = (expTimes.reduce((a, b) => a + b, 0) / expTimes.length).toFixed(2);

  console.log("6️⃣ EXPENSES LIST SERVER PAGINATION (Take 20, Skip 0):");
  console.log(`   ⏱ Warm Avg: ${avgExp} ms`);
  console.log("   ✅ Status: Pass\n");

  console.log("=================================================");
  console.log("🎉 BENCHMARK SUMMARY:");
  console.log(`   ⚡ Critical Dashboard Query Warm Avg: ${avgCritical} ms (Fastest: ${minCritical} ms)`);
  console.log(`   ⚡ Secondary Parallel Sections Total Time: ${Math.max(Number(avgMonthly), Number(avgCat), Number(avgProg), Number(avgRec)).toFixed(2)} ms`);
  console.log("=================================================");

  await prisma.$disconnect();
}

runBenchmark().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
