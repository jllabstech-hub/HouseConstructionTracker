import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { DailySiteLogEntry, DailySiteLogsSummary } from "@/lib/actions/daily-logs";
import { formatPdfINR } from "@/lib/money";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#1c1917", backgroundColor: "#ffffff" },
  brand: { color: "#B85C22", fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: "Helvetica-Bold" },
  title: { fontSize: 16, marginTop: 4, marginBottom: 3, fontFamily: "Helvetica-Bold", color: "#1c1917" },
  subTitle: { fontSize: 9, color: "#57534E", marginBottom: 2 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, borderBottom: "1pt solid #E7E5E4", paddingBottom: 8 },
  kpis: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14, gap: 6 },
  kpi: { flex: 1, border: "1pt solid #E8DCC8", backgroundColor: "#FAF7F2", borderRadius: 6, padding: 7 },
  kpiLabel: { fontSize: 7.5, color: "#78716C", textTransform: "uppercase", fontFamily: "Helvetica-Bold" },
  kpiValue: { fontSize: 12, marginTop: 3, fontFamily: "Helvetica-Bold", color: "#B85C22" },
  kpiSub: { fontSize: 7, color: "#A8A29E", marginTop: 1 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1c1917", marginBottom: 6, marginTop: 4 },
  table: { width: "100%", border: "0.5pt solid #D6D3D1", borderRadius: 4, overflow: "hidden", marginBottom: 12 },
  tableHeader: { flexDirection: "row", backgroundColor: "#F4EEE4", borderBottom: "1pt solid #D6D3D1", paddingVertical: 5, paddingHorizontal: 6, fontFamily: "Helvetica-Bold", fontSize: 8, color: "#44403C" },
  tableRow: { flexDirection: "row", borderBottom: "0.5pt solid #E7E5E4", paddingVertical: 5, paddingHorizontal: 6, alignItems: "center" },
  tableRowAlt: { backgroundColor: "#FAFAF9" },
  colDate: { width: "14%", fontFamily: "Helvetica-Bold" },
  colStage: { width: "16%" },
  colMestri: { width: "20%" },
  colHelper: { width: "20%" },
  colWork: { width: "18%" },
  colAmount: { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold" },
  totalBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FBF4EE", border: "1pt solid #E8DCC8", borderRadius: 6, padding: 8, marginTop: 6 },
  totalText: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1c1917" },
  totalAmount: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#B85C22" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 7.5,
    color: "#A8A29E",
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "0.5pt solid #E7E5E4",
    paddingTop: 4,
  },
});

export function DailyLabourLogPdf({
  projectName,
  logs,
  summary,
  generatedAt,
}: {
  projectName: string;
  logs: DailySiteLogEntry[];
  summary: DailySiteLogsSummary;
  generatedAt?: string;
}) {
  const totalWorkerDays = summary.totalMestriDays + summary.totalHelperDays;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page} wrap>
        {/* Header Strip */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>House Construction Tracker</Text>
            <Text style={styles.title}>Daily Site Labour & Muster Roll Report</Text>
            <Text style={styles.subTitle}>House Project: {projectName || "My Dream House"}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.subTitle}>Report Generated: {generatedAt || new Date().toLocaleDateString("en-IN")}</Text>
            <Text style={styles.subTitle}>Total Entries: {logs.length} Days Recorded</Text>
          </View>
        </View>

        {/* 4 Summary Cards */}
        <View style={styles.kpis}>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Head Masons (Mestri)</Text>
            <Text style={styles.kpiValue}>{summary.totalMestriDays} Days</Text>
            <Text style={styles.kpiSub}>Total mestri work days</Text>
          </View>

          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Helpers (Mazdoors)</Text>
            <Text style={styles.kpiValue}>{summary.totalHelperDays} Days</Text>
            <Text style={styles.kpiSub}>Total helper work days</Text>
          </View>

          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Total Worker Days</Text>
            <Text style={styles.kpiValue}>{totalWorkerDays} Days</Text>
            <Text style={styles.kpiSub}>Combined workforce strength</Text>
          </View>

          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Total Wage Payout</Text>
            <Text style={styles.kpiValue}>{formatPdfINR(summary.totalLabourSpent)}</Text>
            <Text style={styles.kpiSub}>Total daily wages disbursed</Text>
          </View>
        </View>

        {/* Day-Wise Muster Roll Table */}
        <Text style={styles.sectionTitle}>Day-Wise Labour Ledger</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colStage}>Stage / Level</Text>
            <Text style={styles.colMestri}>Masons / Mestri</Text>
            <Text style={styles.colHelper}>Helpers / Mazdoors</Text>
            <Text style={styles.colWork}>Work Done / Notes</Text>
            <Text style={styles.colAmount}>Daily Wages</Text>
          </View>

          {logs.map((log, index) => {
            const isAlt = index % 2 === 1;
            return (
              <View key={log.id} style={[styles.tableRow, isAlt ? styles.tableRowAlt : {}]} wrap={false}>
                <Text style={styles.colDate}>{log.date}</Text>
                <Text style={styles.colStage}>{log.stageName || "General Site Work"}</Text>
                <Text style={styles.colMestri}>
                  {log.mestriCount > 0 ? `${log.mestriCount} @ ${formatPdfINR(log.mestriRate)} = ${formatPdfINR(log.mestriTotal)}` : "-"}
                </Text>
                <Text style={styles.colHelper}>
                  {log.helperCount > 0 ? `${log.helperCount} @ ${formatPdfINR(log.helperRate)} = ${formatPdfINR(log.helperTotal)}` : "-"}
                </Text>
                <Text style={styles.colWork}>{log.workDescription || "-"}</Text>
                <Text style={styles.colAmount}>{formatPdfINR(log.totalLabourCost)}</Text>
              </View>
            );
          })}
        </View>

        {/* Total Footer Banner */}
        <View style={styles.totalBanner} wrap={false}>
          <Text style={styles.totalText}>
            Grand Total Daily Wage Payout ({logs.length} Days Recorded):
          </Text>
          <Text style={styles.totalAmount}>{formatPdfINR(summary.totalLabourSpent)}</Text>
        </View>

        {/* Fixed Footer */}
        <View style={styles.footer} fixed>
          <Text>House Construction Tracker | Daily Site Labour & Muster Roll Audit</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages || 1}`} />
        </View>
      </Page>
    </Document>
  );
}
