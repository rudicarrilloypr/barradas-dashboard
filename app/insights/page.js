// src/app/insights/page.js
import { getOrders, getProducts, getCustomers } from '../../src/lib/shopify';
import InsightsPdfButton from '../../app/components/InsightsPdfButton';

function formatCurrency(amount) {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(parseFloat(amount));
}

// Top productos por ventas (importe total)
function buildTopProductsByRevenue(orders, limit = 5) {
  const map = new Map(); // key: product_id, value: { title, revenue, quantity }

  for (const order of orders) {
    if (!order.line_items) continue;

    for (const item of order.line_items) {
      const id = item.product_id || item.title; // fallback a título si no hay id
      const title = item.title || 'Producto sin nombre';
      const quantity = item.quantity || 0;
      const lineTotal = parseFloat(item.price || 0) * quantity;

      const prev = map.get(id) || { title, revenue: 0, quantity: 0 };
      prev.revenue += lineTotal;
      prev.quantity += quantity;
      map.set(id, prev);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// Ventas por mes (para insights de estacionalidad básica)
function buildSalesByMonth(orders) {
  const map = new Map(); // key: YYYY-MM, value: total

  for (const order of orders) {
    if (!order.created_at) continue;
    const d = new Date(order.created_at);
    const key = d.toISOString().slice(0, 7); // "YYYY-MM"
    const total = parseFloat(order.total_price || 0);
    const prev = map.get(key) || 0;
    map.set(key, prev + (isNaN(total) ? 0 : total));
  }

  return Array.from(map.entries())
    .map(([month, total]) => ({ month, total: Number(total.toFixed(2)) }))
    .sort((a, b) => (a.month > b.month ? 1 : -1));
}

// Leads por mes
function buildLeadsByMonth(customers) {
  const map = new Map(); // key: YYYY-MM, value: count

  for (const c of customers) {
    if (!c.created_at) continue;
    const d = new Date(c.created_at);
    const key = d.toISOString().slice(0, 7);
    const prev = map.get(key) || 0;
    map.set(key, prev + 1);
  }

  return Array.from(map.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => (a.month > b.month ? 1 : -1));
}

// Card simple
function InsightCard({ title, value, description }) {
  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {title}
      </div>
      <div className="text-lg font-semibold text-slate-50">
        {value}
      </div>
      {description && (
        <div className="text-xs text-slate-500">
          {description}
        </div>
      )}
    </div>
  );
}

export default async function InsightsPage() {
  let orders = [];
  let products = [];
  let customers = [];

  try {
    orders = await getOrders();
    products = await getProducts();
    customers = await getCustomers();
  } catch (error) {
    console.error(error);
  }

  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, order) => {
    const n = parseFloat(order.total_price || 0);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const totalLeads = customers.length;
  const totalProducts = products.length;

  const topProducts = buildTopProductsByRevenue(orders);
  const salesByMonth = buildSalesByMonth(orders);
  const leadsByMonth = buildLeadsByMonth(customers);

  // Crecimiento promedio de leads (muy simple: último mes vs penúltimo)
  let leadsTrendText = 'Sin datos suficientes aún.';
  if (leadsByMonth.length >= 2) {
    const last = leadsByMonth[leadsByMonth.length - 1];
    const prev = leadsByMonth[leadsByMonth.length - 2];
    const diff = last.count - prev.count;
    const sign = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';

    leadsTrendText = `Último mes: ${last.count} leads vs ${prev.count} el mes anterior (${sign} ${diff >= 0 ? '+' : ''}${diff}).`;
  }

  // Mes con más ventas
  let bestMonthText = 'Sin datos de ventas suficientes.';
  if (salesByMonth.length > 0) {
    const best = [...salesByMonth].sort((a, b) => b.total - a.total)[0];
    bestMonthText = `Mes más fuerte: ${best.month} con ${formatCurrency(best.total)} en ventas.`;
  }

  // Aquí definimos los datos del reporte PDF (ANTES del return)
  const generatedAt = new Date().toLocaleString("es-MX");

  const report = {
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
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Insights
      </h1>
      <p className="text-sm text-slate-400 mb-3 max-w-xl">
        Módulo de inteligencia básica sobre productos, ventas y leads para apoyar decisiones comerciales.
      </p>

      {/* Botón para generar PDF */}
      <InsightsPdfButton report={report} />

      {/* KPIs generales */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <InsightCard
          title="Ventas totales (muestra)"
          value={formatCurrency(totalSales)}
          description={`Órdenes analizadas: ${totalOrders}`}
        />
        <InsightCard
          title="Productos en catálogo"
          value={totalProducts}
          description="Productos actuales obtenidos desde Shopify"
        />
        <InsightCard
          title="Leads totales"
          value={totalLeads}
          description="Clientes o contactos registrados"
        />
        <InsightCard
          title="Mes más fuerte en ventas"
          value={salesByMonth.length ? salesByMonth[salesByMonth.length - 1].month : '—'}
          description={bestMonthText}
        />
      </div>

      {/* Top productos */}
      <section className="mb-6 bg-slate-950/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Top productos por ingresos
          </h2>
          <span className="text-xs text-slate-500">
            Basado en el importe total vendido
          </span>
        </div>

        {topProducts.length === 0 ? (
          <div className="text-sm text-slate-500">
            Aún no hay órdenes suficientes para calcular productos más vendidos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-slate-900 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-300">Producto</th>
                  <th className="px-4 py-2 text-left text-slate-300">Cantidad vendida</th>
                  <th className="px-4 py-2 text-left text-slate-300">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="border-b border-slate-900/60">
                    <td className="px-4 py-2 text-slate-100">{p.title}</td>
                    <td className="px-4 py-2 text-slate-300">{p.quantity}</td>
                    <td className="px-4 py-2 text-slate-200">
                      {formatCurrency(p.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Leads trend */}
      <section className="bg-slate-950/90 border border-slate-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-100 mb-2">
          Tendencia de leads
        </h2>
        <p className="text-sm text-slate-400 mb-2">
          {leadsTrendText}
        </p>

        {leadsByMonth.length > 0 && (
          <ul className="text-xs text-slate-400 space-y-1">
            {leadsByMonth.map((m) => (
              <li key={m.month}>
                <span className="text-slate-300">{m.month}:</span>{" "}
                {m.count} leads
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
