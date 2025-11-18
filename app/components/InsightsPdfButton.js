// app/components/InsightsPdfButton.js
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

export default function InsightsPdfButton({ report }) {
  const handleGeneratePdf = () => {
    const {
      generatedAt,
      totalSales,
      totalOrders,
      totalLeads,
      totalProducts,
      bestMonthText,
      leadsTrendText,
      topProducts,
      salesByMonth,
      leadsByMonth,
      rangeLabel,
    } = report;

    const doc = new jsPDF("p", "mm", "a4");

    let y = 15;

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Barradas Nexus - Reporte de Insights", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de generación: ${generatedAt}`, 14, y);
    y += 5;
    doc.text(`Rango analizado: ${rangeLabel}`, 14, y);
    y += 8;

    // Resumen
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen general", 14, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Ventas totales (muestra): ${formatCurrency(totalSales)}`, 14, y);
    y += 5;
    doc.text(`Órdenes analizadas: ${totalOrders}`, 14, y);
    y += 5;
    doc.text(`Leads totales (muestra): ${totalLeads}`, 14, y);
    y += 5;
    doc.text(`Productos en catálogo: ${totalProducts}`, 14, y);
    y += 8;

    // Insights de texto
    doc.setFont("helvetica", "bold");
    doc.text("Insights destacados", 14, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    const wrapBest = doc.splitTextToSize(bestMonthText, 180);
    doc.text(wrapBest, 14, y);
    y += wrapBest.length * 5 + 2;

    const wrapLeads = doc.splitTextToSize(leadsTrendText, 180);
    doc.text(wrapLeads, 14, y);
    y += wrapLeads.length * 5 + 8;

    // Top productos por ingresos
    doc.setFont("helvetica", "bold");
    doc.text("Top productos por ingresos", 14, y);
    y += 4;

    const topRows = (topProducts || []).map((p) => [
      p.title,
      String(p.quantity),
      formatCurrency(p.revenue),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Producto", "Cantidad", "Ingresos"]],
      body: topRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : y + 10;

    // Ventas por mes
    doc.setFont("helvetica", "bold");
    doc.text("Ventas por mes", 14, finalY);
    finalY += 4;

    const salesRows = (salesByMonth || []).map((m) => [
      m.month,
      formatCurrency(m.total),
    ]);

    autoTable(doc, {
      startY: finalY,
      head: [["Mes", "Ventas"]],
      body: salesRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : finalY + 10;

    // Leads por mes
    doc.setFont("helvetica", "bold");
    doc.text("Leads por mes", 14, finalY);
    finalY += 4;

    const leadsRows = (leadsByMonth || []).map((m) => [
      m.month,
      String(m.count),
    ]);

    autoTable(doc, {
      startY: finalY,
      head: [["Mes", "Leads"]],
      body: leadsRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    const now = new Date();
    const stamp = now.toISOString().slice(0, 10);
    doc.save(`barradas-nexus-insights-${stamp}.pdf`);
  };

  return (
    <button
      onClick={handleGeneratePdf}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-slate-50 border border-blue-500 shadow-sm shadow-blue-900/40 transition-colors mb-4"
    >
      Descargar Reporte en PDF
      <span className="text-[10px] opacity-80">Insights</span>
    </button>
  );
}
