// Export helpers for Resultados con la marca RollerZone.
// Todos los formatos incluyen automáticamente la referencia a la fuente.

import Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportRow = Record<string, string | number | null | undefined>;

export type ExportMeta = {
  competition: string;
  division?: string | null;
  season?: string | null;
  date?: string | null;
  url: string;
};

const BRAND = "RollerZone.es";
const BRAND_LINE = "Datos extraídos de RollerZone.es";
const BRAND_LONG = "Clasificación generada por RollerZone.es a partir de datos oficiales disponibles.";

function today() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function safeName(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "resultados";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- CSV ----------
export function exportCsv(rows: ExportRow[], meta: ExportMeta) {
  const header = [
    `# ${BRAND_LINE}`,
    `# Competición: ${meta.competition}`,
    meta.division ? `# División: ${meta.division}` : null,
    meta.season ? `# Temporada: ${meta.season}` : null,
    `# Fecha de descarga: ${today()}`,
    `# URL: ${meta.url}`,
    `# Fuente: ${BRAND}`,
    "",
  ].filter(Boolean).join("\n");
  // Añadir columna "Fuente" al final por si el consumidor descarta comentarios.
  const withSource = rows.map((r) => ({ ...r, Fuente: BRAND }));
  const csv = Papa.unparse(withSource);
  const blob = new Blob(["\uFEFF" + header + "\n" + csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `${safeName(meta.competition)}-rollerzone.csv`);
}

// ---------- XLSX ----------
export function exportXlsx(rows: ExportRow[], meta: ExportMeta) {
  const wb = XLSX.utils.book_new();

  // Hoja "Información"
  const info: (string | undefined | null)[][] = [
    [BRAND_LINE],
    [BRAND_LONG],
    [],
    ["Competición", meta.competition],
    ["División", meta.division ?? ""],
    ["Temporada", meta.season ?? ""],
    ["Fecha del evento", meta.date ?? ""],
    ["Fecha de descarga", today()],
    ["URL", meta.url],
    ["Fuente", BRAND],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(info as (string | number)[][]);
  wsInfo["!cols"] = [{ wch: 22 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, "Información");

  // Hoja "Resultados": banner arriba + tabla + pie
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const body = rows.map((r) => headers.map((h) => (r[h] ?? "") as string | number));
  const aoa: (string | number)[][] = [
    [BRAND_LINE],
    [meta.competition + (meta.division ? ` · ${meta.division}` : "")],
    [],
    headers,
    ...body,
    [],
    [BRAND_LINE + " · Fuente: " + BRAND + " · Descarga: " + today()],
  ];
  const wsData = XLSX.utils.aoa_to_sheet(aoa);
  wsData["!cols"] = headers.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, wsData, "Resultados");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  triggerDownload(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${safeName(meta.competition)}-rollerzone.xlsx`);
}

// ---------- PDF ----------
export function exportPdf(rows: ExportRow[], meta: ExportMeta) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Cabecera
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(meta.competition, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  const sub = [meta.division, meta.season, meta.date].filter(Boolean).join(" · ");
  if (sub) doc.text(sub, 40, 58);
  doc.setDrawColor(212, 160, 23);
  doc.setLineWidth(1);
  doc.line(40, 66, pageW - 40, 66);

  const headers = rows.length ? Object.keys(rows[0]) : ["Sin datos"];
  const body = rows.map((r) => headers.map((h) => String(r[h] ?? "")));

  autoTable(doc, {
    startY: 78,
    head: [headers],
    body,
    styles: { fontSize: 9, cellPadding: 4, textColor: [40, 40, 40] },
    headStyles: { fillColor: [26, 26, 26], textColor: [212, 160, 23], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [246, 246, 246] },
    margin: { top: 78, bottom: 48, left: 40, right: 40 },
    didDrawPage: () => {
      // Pie de página en cada hoja
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      const line1 = `${BRAND_LINE} · Fuente: ${BRAND} · Fecha de descarga: ${today()}`;
      const line2 = meta.url;
      doc.text(line1, 40, pageH - 28);
      doc.text(line2, 40, pageH - 16);
      const page = doc.getNumberOfPages();
      doc.text(`Pág. ${page}`, pageW - 40, pageH - 16, { align: "right" });
    },
  });

  doc.save(`${safeName(meta.competition)}-rollerzone.pdf`);
}
