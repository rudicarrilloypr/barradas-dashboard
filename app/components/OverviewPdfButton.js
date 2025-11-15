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
      totalOrders,
      totalLeads,
      totalSales,
      salesByDay,
      catalogGrowth,
      leadsGrowth,
      rangeLabel,
    } = report;

    const doc = new jsPDF("p", "mm", "a4");

    let y = 15;

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Barradas Nexus - Resumen general (Overview)", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de generación: ${generatedAt}`, 14, y);
    y += 5;
    doc.text(`Rango analizado: ${rangeLabel}`, 14, y);
    y += 8;

    // KPIs
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Indicadores clave", 14, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Productos activos: ${totalProducts}`, 14, y);
    y += 5;
    doc.text(`Órdenes totales (muestra): ${totalOrders}`, 14, y);
    y += 5;
    doc.text(`Leads totales (muestra): ${totalLeads}`, 14, y);
    y += 5;
    doc.text(
      `Ventas totales (muestra): ${formatCurrency(totalSales)}`,
      14,
      y
    );
    y += 10;

    // Ventas por día
    doc.setFont("helvetica", "bold");
    doc.text("Ventas por día", 14, y);
    y += 4;

    const salesRows = (salesByDay || []).map((d) => [
      d.date,
      formatCurrency(d.total),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Fecha", "Ventas"]],
      body: salesRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : y + 10;

    // Crecimiento del catálogo
    doc.setFont("helvetica", "bold");
    doc.text("Crecimiento del catálogo (acumulado)", 14, finalY);
    finalY += 4;

    const catalogRows = (catalogGrowth || []).map((d) => [
      d.date,
      String(d.count),
    ]);

    autoTable(doc, {
      startY: finalY,
      head: [["Fecha", "Productos acumulados"]],
      body: catalogRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : finalY + 10;

    // Crecimiento de leads
    doc.setFont("helvetica", "bold");
    doc.text("Crecimiento de leads (acumulado)", 14, finalY);
    finalY += 4;

    const leadsRows = (leadsGrowth || []).map((d) => [
      d.date,
      String(d.count),
    ]);

    autoTable(doc, {
      startY: finalY,
      head: [["Fecha", "Leads acumulados"]],
      body: leadsRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    const now = new Date();
    const stamp = now.toISOString().slice(0, 10); // YYYY-MM-DD

    doc.save(`barradas-nexus-overview-${stamp}.pdf`);
  };

  return (
    <button
      onClick={handleGeneratePdf}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-slate-50 border border-blue-500 shadow-sm shadow-blue-900/40 transition-colors mb-4"
    >
      Descargar Reporte PDF
      <span className="text-[10px] opacity-80">Overview</span>
    </button>
  );
}
