import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PdfReportData } from "@/lib/finance/aggregations";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1c1917" },
  brand: { color: "#B85C22", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" },
  title: { fontSize: 18, marginTop: 6, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  muted: { color: "#57534E", marginBottom: 2 },
  kpis: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, marginBottom: 12, gap: 8 },
  kpi: { width: "48%", border: "1pt solid #E8DCC8", borderRadius: 6, padding: 8 },
  kpiLabel: { fontSize: 8, color: "#78716C", textTransform: "uppercase" },
  kpiValue: { fontSize: 13, marginTop: 4, fontFamily: "Helvetica-Bold" },
  section: { marginTop: 14, marginBottom: 6, fontSize: 12, fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", borderBottom: "0.5pt solid #E7E5E4", paddingVertical: 4 },
  header: { flexDirection: "row", backgroundColor: "#F4EEE4", paddingVertical: 5, fontFamily: "Helvetica-Bold" },
  cell: { flexGrow: 1, flexBasis: 0, paddingRight: 4 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 8,
    color: "#78716C",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  total: { marginTop: 12, padding: 8, backgroundColor: "#FBF4EE", borderRadius: 6 },
});

export function ConstructionReportPdf({ data }: { data: PdfReportData }) {
  const kpis = data.kpis || [];
  const typeBreakdown = data.typeBreakdown || [];
  const tables = data.tables || [];

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.brand}>House Construction Tracker</Text>
        <Text style={styles.title}>{String(data.reportTitle || "Expenditure Report")}</Text>
        <Text style={styles.muted}>Project: {String(data.projectName || "House Project")}</Text>
        <Text style={styles.muted}>Period: {String(data.periodLabel || "All Time")}</Text>
        <Text style={styles.muted}>Generated: {String(data.generatedAt || new Date().toLocaleDateString("en-IN"))}</Text>

        {kpis.length > 0 && (
          <View style={styles.kpis}>
            {kpis.map((kpi, idx) => (
              <View key={`${kpi.label}-${idx}`} style={styles.kpi}>
                <Text style={styles.kpiLabel}>{String(kpi.label ?? "")}</Text>
                <Text style={styles.kpiValue}>{String(kpi.value ?? "")}</Text>
              </View>
            ))}
          </View>
        )}

        {typeBreakdown.length > 0 && (
          <View>
            <Text style={styles.section}>Expenditure by type</Text>
            {typeBreakdown.map((row, idx) => (
              <View key={`${row.label}-${idx}`} style={styles.row}>
                <Text style={styles.cell}>{String(row.label ?? "")}</Text>
                <Text style={styles.cell}>{String(row.value ?? "")}</Text>
              </View>
            ))}
          </View>
        )}

        {tables.map((table, tIdx) => (
          <View key={`${table.title}-${tIdx}`}>
            <Text style={styles.section}>{String(table.title ?? "Details")}</Text>
            {table.headers && table.headers.length > 0 && (
              <View style={styles.header}>
                {table.headers.map((header, hIdx) => (
                  <Text key={`${header}-${hIdx}`} style={styles.cell}>
                    {String(header ?? "")}
                  </Text>
                ))}
              </View>
            )}
            {(table.rows || []).slice(0, 50).map((row, index) => (
              <View key={`${table.title}-${index}`} style={styles.row}>
                {row.map((cell, cellIndex) => (
                  <Text key={cellIndex} style={styles.cell}>
                    {String(cell ?? "—")}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ))}

        <View style={styles.total}>
          <Text>
            {String(data.totalLabel || "Total")}: {String(data.totalValue || "₹0")}
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>House Construction Tracker · Material purchases are never mixed with labour payments</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages || 1}`} />
        </View>
      </Page>
    </Document>
  );
}
