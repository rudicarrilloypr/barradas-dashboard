// app/components/OverviewPdfButton.js
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatCurrency(amount) {
  if (!amount) return "$0";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(parseFloat(amount));
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
      commercialSummary,
      salesByDay,
      catalogGrowth,
      leadsGrowth,
      rangeLabel,
    } = report;

    const doc = new jsPDF("p", "mm", "a4");
    let y = 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Barradas Nexus - Resumen comercial", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de generacion: ${generatedAt}`, 14, y);
    y += 5;
    doc.text(`Rango analizado: ${rangeLabel}`, 14, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Lectura comercial", 14, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(commercialSummary || "", 180);
    doc.text(summaryLines, 14, y);
    y += summaryLines.length * 5 + 8;

    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Valor"]],
      body: [
        ["Productos activos", String(activeProductsTotal)],
        ["Productos creados en rango", String(totalProducts)],
        ["Ordenes", String(totalOrders)],
        ["Leads", String(totalLeads)],
        ["Ventas totales", formatCurrency(totalSales)],
        ["Ventas pagadas", formatCurrency(paidSales)],
        ["Ticket promedio", formatCurrency(averageOrderValue)],
        ["Pagos pendientes", String(pendingOrdersCount)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : y + 20;

    doc.setFont("helvetica", "bold");
    doc.text("Ventas por dia", 14, finalY);
    finalY += 4;

    autoTable(doc, {
      startY: finalY,
      head: [["Fecha", "Ventas"]],
      body: (salesByDay || []).map((day) => [
        day.date,
        formatCurrency(day.total),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : finalY + 20;

    doc.setFont("helvetica", "bold");
    doc.text("Crecimiento del catalogo", 14, finalY);
    finalY += 4;

    autoTable(doc, {
      startY: finalY,
      head: [["Fecha", "Productos acumulados"]],
      body: (catalogGrowth || []).map((day) => [
        day.date,
        String(day.count),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : finalY + 20;

    doc.setFont("helvetica", "bold");
    doc.text("Crecimiento de leads", 14, finalY);
    finalY += 4;

    autoTable(doc, {
      startY: finalY,
      head: [["Fecha", "Leads acumulados"]],
      body: (leadsGrowth || []).map((day) => [
        day.date,
        String(day.count),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

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
