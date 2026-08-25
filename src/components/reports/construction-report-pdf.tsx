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
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.brand}>House Construction Tracker</Text>
        <Text style={styles.title}>{data.reportTitle}</Text>
        <Text style={styles.muted}>Project: {data.projectName}</Text>
        <Text style={styles.muted}>Period: {data.periodLabel}</Text>
        <Text style={styles.muted}>Generated: {data.generatedAt}</Text>

        <View style={styles.kpis}>
          {data.kpis.map((kpi) => (
            <View key={kpi.label} style={styles.kpi}>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
            </View>
          ))}
        </View>

        <View>
          <Text style={styles.section}>Expenditure by type</Text>
          {data.typeBreakdown.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.cell}>{row.label}</Text>
              <Text style={styles.cell}>{row.value}</Text>
            </View>
          ))}
        </View>

        {data.tables.map((table) => (
          <View key={table.title}>
            <Text style={styles.section}>{table.title}</Text>
            <View style={styles.header}>
              {table.headers.map((header) => (
                <Text key={header} style={styles.cell}>
                  {header}
                </Text>
              ))}
            </View>
            {table.rows.slice(0, 40).map((row, index) => (
              <View key={`${table.title}-${index}`} style={styles.row}>
                {row.map((cell, cellIndex) => (
                  <Text key={cellIndex} style={styles.cell}>
                    {cell}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ))}

        <View style={styles.total}>
          <Text>
            {data.totalLabel}: {data.totalValue}
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>House Construction Tracker · Material purchases are never mixed with labour payments</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
