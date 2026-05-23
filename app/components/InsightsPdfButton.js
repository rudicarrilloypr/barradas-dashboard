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
      decisionRows,
      topProducts,
      typeRows,
      leadMonthRows,
    } = report;

    const doc = new jsPDF("p", "mm", "a4");
    let y = 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Barradas Nexus - Reporte ejecutivo", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de generacion: ${generatedAt}`, 14, y);
    y += 5;
    doc.text(`Rango analizado: ${rangeLabel}`, 14, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Lectura ejecutiva", 14, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(executiveSummary || "", 180);
    doc.text(summaryLines, 14, y);
    y += summaryLines.length * 5 + 8;

    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Valor"]],
      body: [
        ["Ventas", formatCurrency(totalSales)],
        ["Ordenes", String(totalOrders)],
        ["Ticket promedio", formatCurrency(averageOrderValue)],
        ["Productos activos", String(activeProducts)],
        ["Productos con alertas", String(productsWithIssues)],
        ["Leads", String(totalLeads)],
        ["Leads contactables", String(contactableLeads)],
        ["Leads incompletos", String(incompleteLeads)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : y + 20;

    doc.setFont("helvetica", "bold");
    doc.text("Acciones recomendadas", 14, finalY);
    finalY += 4;

    autoTable(doc, {
      startY: finalY,
      head: [["Area", "Prioridad", "Lectura", "Accion"]],
      body: (decisionRows || []).map((row) => [
        row.area,
        row.priority,
        row.insight,
        row.action,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : finalY + 20;

    doc.setFont("helvetica", "bold");
    doc.text("Mix de catalogo", 14, finalY);
    finalY += 4;

    autoTable(doc, {
      startY: finalY,
      head: [["Categoria", "Productos"]],
      body: (typeRows || []).map((row) => [row.label, String(row.value)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : finalY + 20;

    doc.setFont("helvetica", "bold");
    doc.text("Leads por mes", 14, finalY);
    finalY += 4;

    autoTable(doc, {
      startY: finalY,
      head: [["Mes", "Leads"]],
      body: (leadMonthRows || []).map((row) => [row.label, String(row.value)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : finalY + 20;

    if ((topProducts || []).length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Top productos por ingresos", 14, finalY);
      finalY += 4;

      autoTable(doc, {
        startY: finalY,
        head: [["Producto", "Unidades", "Ingresos"]],
        body: topProducts.map((product) => [
          product.title,
          String(product.quantity),
          formatCurrency(product.revenue),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 23, 42] },
      });
    }

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
