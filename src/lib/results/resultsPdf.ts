/**
 * Plantilla PDF de clasificaciones Rollerzone (reutilizable para cualquier campeonato).
 * Se genera en el navegador con los datos ya cargados en la página: no consulta fuentes externas.
 */
import type { jsPDF as JsPDF } from "jspdf";
import logoUrl from "@/assets/rollerzone-logo.png";
import fontRegular from "@/assets/pdf-font-regular.ttf.asset.json";
import fontBold from "@/assets/pdf-font-bold.ttf.asset.json";

export type PdfRow = {
  position: number | null;
  bib: string | null;
  athlete: string;
  country: string | null;
  time: string | null;
  points: number | null;
  gap: string | null;
  notes: string | null;
};
export type PdfMeta = {
  championship: string;
  title: string;
  competitionDate: string | null; // dd/mm/aaaa
  modality: string | null;
  distance: string | null;
  category: string | null;
  gender: string | null;
  phase: string | null;
  source: string; // atribución
  unconfirmed: boolean; // la fuente no indica oficialidad
};

const DARK = "#202124", GOLD = "#D4AF37", ALT = "#F6F4EE", MUTED = "#6B6B6B", LINE = "#E2DED3";
type Col = { key: keyof PdfRow; head: string; w: number; min: number; align: "left" | "center" | "right" };
const COLS: Col[] = [
  { key: "position", head: "Pto.", w: 0.7, min: 10, align: "center" },
  { key: "bib", head: "Dorsal", w: 0.9, min: 13, align: "center" },
  { key: "athlete", head: "Patinador/a", w: 4.2, min: 55, align: "left" },
  { key: "country", head: "País", w: 0.9, min: 12, align: "center" },
  { key: "time", head: "Tiempo", w: 1.4, min: 18, align: "right" },
  { key: "points", head: "Puntos", w: 1.0, min: 14, align: "right" },
  { key: "gap", head: "Diferencia", w: 1.3, min: 18, align: "right" },
  { key: "notes", head: "Sanciones / Obs.", w: 1.8, min: 26, align: "left" },
];

const cache: Record<string, string> = {};
async function b64(url: string): Promise<string> {
  if (cache[url]) return cache[url];
  const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return (cache[url] = btoa(s));
}
async function imgSize(url: string): Promise<[number, number]> {
  return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok([i.naturalWidth, i.naturalHeight]); i.onerror = ko; i.src = url; });
}

function cell(r: PdfRow, k: keyof PdfRow): string {
  const v = r[k];
  if (k === "position") return v == null || v === 0 ? "–" : String(v);
  if (v == null) return "";
  let s = String(v).trim();
  if (k === "time") { if (s.startsWith("00:")) s = s.slice(3); if (s.replace(/[0:.]/g, "") === "") s = "—"; }
  return s;
}

export async function buildResultsPdf(rows: PdfRow[], meta: PdfMeta, opts: { generatedAt?: Date } = {}): Promise<JsPDF> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const cols = COLS.filter((c) => c.key === "position" || c.key === "athlete" || rows.some((r) => cell(r, c.key) !== "" && !(c.key === "time" && cell(r, c.key) === "—" && rows.every((x) => cell(x, "time") === "—"))));
  const need = cols.reduce((a, c) => a + c.min, 0);
  const orientation = need > 210 - 28 ? "landscape" : "portrait";

  const [reg, bold, logo, [lw0, lh0]] = await Promise.all([b64(fontRegular.url), b64(fontBold.url), b64(logoUrl), imgSize(logoUrl)]);
  const gen = opts.generatedAt ?? new Date();
  const generated = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(gen).replace(",", "");

  const codes = [...new Set(rows.flatMap((r) => (r.notes ?? "").split(/[\s,;/]+/).map((x) => x.trim()).filter(Boolean)))];
  const tailLines = [
    ...(codes.length ? [`Sanciones y observaciones: códigos tal como figuran en la fuente (${codes.join(", ")}).`] : []),
    `${rows.length} participantes · Datos y posiciones tal como los publica ${meta.source}, incluidos empates y DNS.` +
      (meta.unconfirmed ? " La fuente no indica si la clasificación es oficial o provisional." : ""),
  ];

  const make = () => {
    const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
    doc.addFileToVFS("rz.ttf", reg); doc.addFont("rz.ttf", "RZ", "normal");
    doc.addFileToVFS("rzb.ttf", bold); doc.addFont("rzb.ttf", "RZ", "bold");
    doc.setFont("RZ", "normal");
    return doc;
  };
  const M = 14, HDR = 30;

  const decorate = (doc: JsPDF, page: number) => {
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    doc.setFillColor(DARK); doc.rect(0, 0, W, HDR, "F");
    const lh = 15, lw = (lh * lw0) / lh0;
    doc.addImage(`data:image/png;base64,${logo}`, "PNG", M, (HDR - lh) / 2 + 1, lw, lh);
    doc.setFont("RZ", "bold"); doc.setFontSize(8.5); doc.setTextColor(GOLD);
    doc.text("ARCHIVO DE RESULTADOS", W - M, 13, { align: "right" });
    doc.setFont("RZ", "normal"); doc.setFontSize(8); doc.setTextColor("#FFFFFF");
    doc.text(meta.championship, W - M, 18, { align: "right" });
    doc.setFontSize(6.5); doc.setTextColor("#BDBDBD");
    doc.text(`Documento generado: ${generated} (hora de Madrid)`, W - M, 22.5, { align: "right" });
    doc.setDrawColor(GOLD); doc.setLineWidth(0.7); doc.line(0, HDR, W, HDR);
    doc.setLineWidth(0.2); doc.line(M, H - 14, W - M, H - 14);
    doc.setFontSize(7.5); doc.setFont("RZ", "bold"); doc.setTextColor(DARK);
    doc.text("Archivo de resultados · Rollerzone.es", M, H - 9.5);
    doc.setFont("RZ", "normal"); doc.setTextColor(MUTED);
    doc.text(`Fuente de resultados: ${meta.source}`, W / 2, H - 9.5, { align: "center" });
    doc.setTextColor(DARK); doc.text(`Página ${page}`, W - M, H - 9.5, { align: "right" });
    if (page > 1) {
      // Recordatorio discreto de la prueba en páginas siguientes.
      doc.setFont("RZ", "normal"); doc.setFontSize(7); doc.setTextColor(MUTED);
      doc.text([meta.title, meta.phase ?? "Clasificación final"].join(" · "), M, HDR + 5.5, { maxWidth: W - 2 * M });
    }
  };

  const intro = (doc: JsPDF): number => {
    const W = doc.internal.pageSize.getWidth();
    let y = HDR + 9;
    doc.setFont("RZ", "bold"); doc.setFontSize(8); doc.setTextColor(GOLD);
    doc.text(meta.championship.toUpperCase(), M, y); y += 7;
    doc.setFontSize(17); doc.setTextColor(DARK);
    const tl = doc.splitTextToSize(meta.title, W - 2 * M) as string[];
    doc.text(tl, M, y); y += tl.length * 7 + 1;
    const facts: [string, string | null][] = [["Fecha de competición", meta.competitionDate], ["Modalidad", meta.modality], ["Distancia / prueba", meta.distance], ["Categoría", meta.category], ["Género", meta.gender], ["Fase", meta.phase ?? "Clasificación final"]];
    const fr = [1.25, 1.6, 1.5, 0.75, 0.85, 1.6], tot = fr.reduce((a, b) => a + b, 0);
    doc.setDrawColor(GOLD); doc.setLineWidth(0.4); doc.line(M, y, W - M, y);
    let x = M, maxH = 0;
    facts.forEach(([k, v], i) => {
      const w = ((W - 2 * M) * fr[i]) / tot - 2;
      doc.setFont("RZ", "bold"); doc.setFontSize(6); doc.setTextColor(MUTED);
      doc.text(k.toUpperCase(), x, y + 3.5, { maxWidth: w });
      doc.setFontSize(8.5); doc.setTextColor(DARK);
      const vl = doc.splitTextToSize(v || "—", w) as string[];
      doc.text(vl, x, y + 8);
      maxH = Math.max(maxH, 8 + vl.length * 3.8);
      x += w + 2;
    });
    return y + maxH + 4;
  };

  const W0 = orientation === "portrait" ? 210 : 297;
  const tot = cols.reduce((a, c) => a + c.w, 0);
  const widths = cols.map((c) => ((W0 - 2 * M) * c.w) / tot);
  const head = [cols.map((c) => c.head.toUpperCase())];
  const body = rows.map((r) => cols.map((c) => cell(r, c.key)));

  const runTable = (doc: JsPDF, chunk: string[][], offset: number, startY: number, pad: number, track?: number[]) => {
    autoTable(doc, {
      head, body: chunk, startY, margin: { left: M, right: M, top: HDR + 9, bottom: 20 },
      theme: "plain", showHead: "everyPage",
      styles: { font: "RZ", fontSize: 8.5, textColor: DARK, cellPadding: { top: pad, bottom: pad, left: 1.6, right: 1.6 }, lineColor: LINE, valign: "middle", overflow: "linebreak" },
      headStyles: { fillColor: DARK, textColor: GOLD, fontStyle: "bold", fontSize: 7.5 },
      columnStyles: Object.fromEntries(cols.map((c, i) => [i, { cellWidth: widths[i], halign: c.align, fontStyle: c.key === "position" || c.key === "athlete" ? "bold" : "normal" }])),
      didParseCell: (d) => {
        if (d.section === "body") {
          const idx = offset + d.row.index;
          if (idx % 2 === 1) d.cell.styles.fillColor = ALT;
          d.cell.styles.lineWidth = { bottom: 0.1 } as never;
        }
        if (d.section === "head") d.cell.styles.halign = cols[d.column.index].align;
      },
      didDrawCell: (d) => {
        if (d.section === "body" && d.column.index === 0) {
          const idx = offset + d.row.index;
          if (track) track[idx] = doc.getNumberOfPages();
          if (idx < 3) { doc.setDrawColor(GOLD); doc.setLineWidth(0.85); doc.line(d.cell.x, d.cell.y, d.cell.x, d.cell.y + d.cell.height); }
        }
        if (d.section === "head" && d.column.index === cols.length - 1) { doc.setDrawColor(GOLD); doc.setLineWidth(0.4); doc.line(M, d.cell.y + d.cell.height, d.cell.x + d.cell.width, d.cell.y + d.cell.height); }
      },
    });
    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  };

  const tailH = tailLines.length * 4.2 + 6;
  const MIN_LAST = 8;
  // 1) Simulación para saber en qué página cae cada fila; se prueba con espaciados decrecientes.
  let pad = 1.25, pages: number[] = [];
  for (const p of [1.25, 1.05, 0.85]) {
    const doc = make(); const track: number[] = [];
    const y = runTable(doc, body, 0, intro(doc), p, track);
    const H = doc.internal.pageSize.getHeight();
    if (y + tailH > H - 20) track.push(doc.getNumberOfPages() + 1); // el pie no cabe
    pad = p; pages = track;
    const last = pages[pages.length - 1], n = pages.filter((x) => x === last).length;
    if (last === 1 || n >= MIN_LAST) break;
  }
  // 2) Reequilibrio: la última página nunca queda con menos de MIN_LAST filas.
  const groups: number[][] = [];
  pages.forEach((pg, i) => { if (i < rows.length) (groups[pg - 1] ??= []).push(i); });
  const g = groups.filter(Boolean);
  if (g.length > 1 && g[g.length - 1].length < MIN_LAST) {
    const need = Math.min(MIN_LAST, Math.floor(rows.length / g.length)) - g[g.length - 1].length;
    for (let k = 0; k < need; k++) { const prev = g[g.length - 2]; if (prev.length <= 1) break; g[g.length - 1].unshift(prev.pop()!); }
  }
  // 3) Documento definitivo, página a página.
  const doc = make();
  let y = intro(doc), off = 0;
  g.forEach((idxs, gi) => {
    if (gi > 0) { doc.addPage(); y = HDR + 9; }
    y = runTable(doc, idxs.map((i) => body[i]), off, y, pad);
    off += idxs.length;
  });
  const H = doc.internal.pageSize.getHeight(), W = doc.internal.pageSize.getWidth();
  if (y + tailH > H - 20) { doc.addPage(); y = HDR + 9; }
  y += 5;
  doc.setFont("RZ", "normal"); doc.setFontSize(7); doc.setTextColor(MUTED);
  for (const t of tailLines) { const l = doc.splitTextToSize(t, W - 2 * M) as string[]; doc.text(l, M, y); y += l.length * 3.4 + 1.2; }
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) { doc.setPage(p); decorate(doc, p); }
  doc.setProperties({ title: `${meta.championship} · ${meta.title}`, author: "Rollerzone.es", subject: `Fuente de resultados: ${meta.source}` });
  return doc;
}

export function pdfFileName(meta: PdfMeta) {
  const s = [meta.championship, meta.title, meta.phase].filter(Boolean).join(" ");
  return `rollerzone-${s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90)}.pdf`;
}
