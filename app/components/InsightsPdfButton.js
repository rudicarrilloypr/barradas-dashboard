// app/components/InsightsPdfButton.js
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BRAND_COLOR = [15, 23, 42];
const ACCENT_COLOR = [37, 99, 235];
const MUTED_COLOR = [100, 116, 139];

function formatCurrency(amount) {
  if (!amount) return "$0";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(parseFloat(amount));
}

function formatNumber(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("es-MX").format(number);
}

function formatPercent(value) {
  if (!isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function text(value) {
  if (value === null || value === undefined || value === "") return "Sin dato";
  return String(value);
}

function ensureSpace(doc, y, needed = 24) {
  if (y + needed <= PAGE_HEIGHT - 18) return y;
  doc.addPage();
  return 18;
}

function addTitle(doc, title, subtitle) {
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, PAGE_WIDTH, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, MARGIN, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(subtitle, MARGIN, 18);
  doc.setTextColor(15, 23, 42);
  return 34;
}

function addSection(doc, title, y) {
  y = ensureSpace(doc, y, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_COLOR);
  doc.text(title, MARGIN, y);
  doc.setDrawColor(...ACCENT_COLOR);
  doc.line(MARGIN, y + 2, MARGIN + 42, y + 2);
  return y + 7;
}

function addParagraph(doc, value, y) {
  y = ensureSpace(doc, y, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const lines = doc.splitTextToSize(text(value), CONTENT_WIDTH);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 4.4 + 5;
}

function addTable(doc, title, head, body, y, options = {}) {
  y = addSection(doc, title, y);
  const rows = body?.length
    ? body
    : [[options.emptyMessage || "Sin datos para mostrar.", ...Array(head.length - 1).fill("-")]];

  autoTable(doc, {
    startY: y,
    head: [head],
    body: rows,
    theme: "grid",
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      fontSize: options.fontSize || 8,
      cellPadding: 2,
      valign: "top",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: options.columnStyles || {},
  });

  return doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : y + 20;
}

function addFooters(doc, generatedAt) {
  const pages = doc.getNumberOfPages();

  for (let index = 1; index <= pages; index += 1) {
    doc.setPage(index);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, PAGE_HEIGHT - 13, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    doc.text("Barradas Nexus - analisis desde Shopify Admin API", MARGIN, PAGE_HEIGHT - 8);
    doc.text(
      `Generado: ${generatedAt} | Pagina ${index} de ${pages}`,
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 8,
      { align: "right" }
    );
  }
}

export default function InsightsPdfButton({ report }) {
  const handleGeneratePdf = () => {
    const {
      generatedAt,
      rangeLabel,
      executiveSummary,
      totalSales,
      totalOrders,
      averageOrderValue,
      activeProducts,
      productsWithIssues,
      totalLeads,
      contactableLeads,
      incompleteLeads,
      decisionRows = [],
      topProducts = [],
      typeRows = [],
      leadMonthRows = [],
      productIssueSummaryRows = [],
      productIssueRows = [],
      leadQualityRows = [],
      sourceLabel,
    } = report;

    const doc = new jsPDF("p", "mm", "a4");
    let y = addTitle(
      doc,
      "Barradas Nexus - Reporte ejecutivo de inteligencia",
      "Analisis de ventas, catalogo, leads y prioridades"
    );

    const contactableRate = totalLeads ? (contactableLeads / totalLeads) * 100 : 0;
    const incompleteRate = totalLeads ? (incompleteLeads / totalLeads) * 100 : 0;

    y = addTable(
      doc,
      "Alcance del reporte",
      ["Campo", "Detalle"],
      [
        ["Fecha de generacion", text(generatedAt)],
        ["Fuente", text(sourceLabel || "Shopify Admin API")],
        ["Rango analizado", text(rangeLabel)],
        ["Objetivo", "Convertir los datos visibles en la app en una lectura accionable para decisiones comerciales."],
      ],
      y
    );

    y = addSection(doc, "Lectura ejecutiva", y);
    y = addParagraph(doc, executiveSummary, y);

    y = addTable(
      doc,
      "KPIs ejecutivos",
      ["Indicador", "Valor", "Interpretacion"],
      [
        ["Ventas", formatCurrency(totalSales), "Monto vendido en el rango seleccionado."],
        ["Ordenes", formatNumber(totalOrders), "Cantidad de ordenes encontradas en Shopify."],
        ["Ticket promedio", formatCurrency(averageOrderValue), "Ventas divididas entre ordenes."],
        ["Productos activos", formatNumber(activeProducts), "Catalogo activo disponible para operar."],
        ["Productos con alertas", formatNumber(productsWithIssues), "Productos con datos o inventario que requieren revision."],
        ["Leads", formatNumber(totalLeads), "Contactos creados en el rango seleccionado."],
        ["Leads contactables", `${formatNumber(contactableLeads)} (${formatPercent(contactableRate)})`, "Con email o telefono disponible."],
        ["Leads incompletos", `${formatNumber(incompleteLeads)} (${formatPercent(incompleteRate)})`, "Con algun dato importante faltante."],
      ],
      y,
      {
        columnStyles: {
          0: { cellWidth: 44 },
          1: { cellWidth: 40 },
          2: { cellWidth: 98 },
        },
      }
    );

    y = addTable(
      doc,
      "Acciones recomendadas",
      ["Area", "Prioridad", "Lectura", "Accion sugerida"],
      decisionRows.map((row) => [
        text(row.area),
        text(row.priority),
        text(row.insight),
        text(row.action),
      ]),
      y,
      {
        fontSize: 7.5,
        emptyMessage: "No hay acciones recomendadas para este rango.",
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 24 },
          2: { cellWidth: 62 },
          3: { cellWidth: 72 },
        },
      }
    );

    y = addTable(
      doc,
      "Calidad del catalogo",
      ["Alerta", "Productos", "Lectura"],
      productIssueSummaryRows.map((row) => [
        text(row.issue),
        formatNumber(row.count),
        row.count > 0 ? "Revisar antes de enviar trafico o invertir pauta." : "Sin alerta detectada.",
      ]),
      y,
      {
        columnStyles: {
          1: { halign: "right" },
        },
      }
    );

    y = addTable(
      doc,
      "Productos con alertas",
      ["Producto", "Estado", "Tipo", "Stock", "Precio desde", "Alertas"],
      productIssueRows.map((product) => [
        text(product.title),
        text(product.status),
        text(product.type),
        formatNumber(product.stock),
        formatCurrency(product.price),
        text(product.issues),
      ]),
      y,
      {
        fontSize: 7,
        emptyMessage: "No hay productos con alertas detectadas.",
        columnStyles: {
          0: { cellWidth: 48 },
          1: { cellWidth: 22 },
          2: { cellWidth: 34 },
          3: { cellWidth: 18, halign: "right" },
          4: { cellWidth: 26, halign: "right" },
          5: { cellWidth: 34 },
        },
      }
    );

    y = addTable(
      doc,
      "Mix de catalogo",
      ["Categoria", "Productos"],
      typeRows.map((row) => [text(row.label), formatNumber(row.value)]),
      y,
      {
        emptyMessage: "No hay categorias para mostrar.",
        columnStyles: { 1: { halign: "right" } },
      }
    );

    y = addTable(
      doc,
      "Calidad de leads",
      ["Metrica", "Valor", "Detalle"],
      leadQualityRows.map((row) => [
        text(row.metric),
        formatNumber(row.value),
        text(row.detail),
      ]),
      y,
      {
        emptyMessage: "No hay leads para analizar en este rango.",
        columnStyles: {
          1: { halign: "right" },
        },
      }
    );

    y = addTable(
      doc,
      "Captacion de leads por mes",
      ["Mes", "Leads"],
      leadMonthRows.map((row) => [text(row.label), formatNumber(row.value)]),
      y,
      {
        emptyMessage: "No hay historial de leads para mostrar.",
        columnStyles: { 1: { halign: "right" } },
      }
    );

    y = addTable(
      doc,
      "Top productos por ingresos",
      ["Producto", "Unidades", "Ingresos"],
      topProducts.map((product) => [
        text(product.title),
        formatNumber(product.quantity),
        formatCurrency(product.revenue),
      ]),
      y,
      {
        emptyMessage: "Aun no hay ordenes suficientes para calcular productos lider.",
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "right" },
        },
      }
    );

    y = addTable(
      doc,
      "Notas de precision",
      ["Tema", "Detalle"],
      [
        ["Rango", "El PDF usa el mismo rango seleccionado en la app."],
        ["Ventas", "Los ingresos se calculan con line_items y total_price disponibles en Shopify."],
        ["Catalogo", "Las alertas se calculan con imagen, tipo, precio, stock y estado del producto."],
        ["Leads", "La calidad de leads se calcula con email, telefono, nombre y pais disponible."],
        ["Acciones", "Las recomendaciones se generan a partir de los indicadores del reporte, no son ediciones automaticas en Shopify."],
      ],
      y
    );

    addFooters(doc, generatedAt);

    const stamp = new Date().toISOString().slice(0, 10);
    doc.save(`barradas-nexus-reporte-ejecutivo-${stamp}.pdf`);
  };

  return (
    <button
      onClick={handleGeneratePdf}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-slate-50 border border-blue-500 shadow-sm shadow-blue-900/40 transition-colors mb-4"
    >
      Descargar Reporte Ejecutivo
      <span className="text-[10px] opacity-80">PDF</span>
    </button>
  );
}
