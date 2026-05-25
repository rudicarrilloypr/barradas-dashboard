// app/components/OverviewPdfButton.js
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
    doc.text("Barradas Nexus - datos desde Shopify Admin API", MARGIN, PAGE_HEIGHT - 8);
    doc.text(
      `Generado: ${generatedAt} | Pagina ${index} de ${pages}`,
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 8,
      { align: "right" }
    );
  }
}

function getBestSalesDay(salesByDay) {
  return [...(salesByDay || [])].sort((a, b) => b.total - a.total)[0];
}

export default function OverviewPdfButton({ report }) {
  const handleGeneratePdf = () => {
    const {
      generatedAt,
      totalProducts,
      activeProductsTotal,
      totalOrders,
      totalLeads,
      totalSales,
      paidSales,
      averageOrderValue,
      pendingOrdersCount,
      paidOrdersCount,
      commercialSummary,
      salesByDay = [],
      catalogGrowth = [],
      leadsGrowth = [],
      recentOrderRows = [],
      rangeLabel,
      totalProductsInStore,
      totalCustomersInStore,
      sourceLabel,
    } = report;

    const doc = new jsPDF("p", "mm", "a4");
    let y = addTitle(
      doc,
      "Barradas Nexus - Reporte de resumen comercial",
      "Lectura general de ventas, catalogo y leads"
    );

    const bestSalesDay = getBestSalesDay(salesByDay);
    const paidRate = totalOrders ? (Number(paidOrdersCount || 0) / totalOrders) * 100 : 0;
    const pendingSales = Math.max(Number(totalSales || 0) - Number(paidSales || 0), 0);

    y = addTable(
      doc,
      "Alcance del reporte",
      ["Campo", "Detalle"],
      [
        ["Fecha de generacion", text(generatedAt)],
        ["Fuente", text(sourceLabel || "Shopify Admin API")],
        ["Rango analizado", text(rangeLabel)],
        ["Productos totales en Shopify", formatNumber(totalProductsInStore)],
        ["Clientes/leads totales en Shopify", formatNumber(totalCustomersInStore)],
        ["Nota", "Los importes se calculan con los datos disponibles en Shopify para el rango seleccionado."],
      ],
      y
    );

    y = addSection(doc, "Lectura comercial", y);
    y = addParagraph(doc, commercialSummary, y);

    y = addTable(
      doc,
      "KPIs principales",
      ["Indicador", "Valor", "Como leerlo"],
      [
        ["Productos activos", formatNumber(activeProductsTotal), "Catalogo actualmente disponible para operar."],
        ["Productos creados en rango", formatNumber(totalProducts), "Altas de productos segun fecha de creacion."],
        ["Ordenes en rango", formatNumber(totalOrders), "Ordenes encontradas en Shopify para este periodo."],
        ["Leads en rango", formatNumber(totalLeads), "Clientes/contactos creados en el periodo."],
        ["Ventas totales", formatCurrency(totalSales), "Suma de ordenes del rango, sin separar estado de pago."],
        ["Ventas pagadas/parciales", formatCurrency(paidSales), "Monto con estado paid o partially_paid."],
        ["Ticket promedio", formatCurrency(averageOrderValue), "Ventas totales divididas entre ordenes."],
        ["Pagos pendientes", formatNumber(pendingOrdersCount), "Ordenes pending, authorized o partially_paid."],
        ["Tasa de ordenes pagadas", formatPercent(paidRate), "Proporcion de ordenes pagadas o parcialmente pagadas."],
        ["Monto pendiente estimado", formatCurrency(pendingSales), "Diferencia entre ventas totales y ventas pagadas."],
      ],
      y,
      {
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 36 },
          2: { cellWidth: 101 },
        },
      }
    );

    y = addTable(
      doc,
      "Detalle de ordenes del rango",
      ["Fecha", "Orden", "Cliente", "Pago", "Fulfillment", "Total"],
      recentOrderRows.map((order) => [
        text(order.date),
        text(order.order),
        text(order.customer),
        text(order.paymentStatus),
        text(order.fulfillmentStatus),
        formatCurrency(order.total),
      ]),
      y,
      {
        emptyMessage: "No hay ordenes en el rango seleccionado.",
        fontSize: 7,
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 23 },
          2: { cellWidth: 45 },
          3: { cellWidth: 28 },
          4: { cellWidth: 34 },
          5: { cellWidth: 30, halign: "right" },
        },
      }
    );

    y = addTable(
      doc,
      "Ventas por dia que alimentan la grafica",
      ["Fecha", "Ventas del dia"],
      salesByDay.map((day) => [text(day.date), formatCurrency(day.total)]),
      y,
      {
        emptyMessage: "No hay ventas diarias para el rango seleccionado.",
        columnStyles: { 1: { halign: "right" } },
      }
    );

    y = addTable(
      doc,
      "Crecimiento del catalogo que alimenta la grafica",
      ["Fecha", "Productos acumulados"],
      catalogGrowth.map((day) => [text(day.date), formatNumber(day.count)]),
      y,
      {
        emptyMessage: "No hay productos creados en el rango seleccionado.",
        columnStyles: { 1: { halign: "right" } },
      }
    );

    y = addTable(
      doc,
      "Crecimiento de leads que alimenta la grafica",
      ["Fecha", "Leads acumulados"],
      leadsGrowth.map((day) => [text(day.date), formatNumber(day.count)]),
      y,
      {
        emptyMessage: "No hay leads creados en el rango seleccionado.",
        columnStyles: { 1: { halign: "right" } },
      }
    );

    y = addTable(
      doc,
      "Notas de precision",
      ["Tema", "Detalle"],
      [
        ["Mejor dia de ventas", bestSalesDay ? `${bestSalesDay.date}: ${formatCurrency(bestSalesDay.total)}` : "Sin ventas en el rango."],
        ["Rango", "El PDF respeta el mismo rango seleccionado en la app."],
        ["Ventas", "Las ventas se basan en total_price de Shopify."],
        ["Leads", "Los leads se basan en customers creados en Shopify."],
        ["Catalogo", "El crecimiento de catalogo usa productos activos creados dentro del rango."],
      ],
      y
    );

    addFooters(doc, generatedAt);

    const stamp = new Date().toISOString().slice(0, 10);
    doc.save(`barradas-nexus-resumen-comercial-${stamp}.pdf`);
  };

  return (
    <button
      onClick={handleGeneratePdf}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-slate-50 border border-blue-500 shadow-sm shadow-blue-900/40 transition-colors mb-4"
    >
      Descargar Reporte PDF
      <span className="text-[10px] opacity-80">Resumen</span>
    </button>
  );
}
