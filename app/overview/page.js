// src/app/overview/page.js
import { getProducts, getOrders, getCustomers } from '../../src/lib/shopify';
import OverviewSalesChart from '../../app/components/charts/OverviewSalesChart';
import CatalogGrowthChart from '../../app/components/charts/CatalogGrowthChart';
import LeadsGrowthChart from '../../app/components/charts/LeadsGrowthChart';

function Card({ title, value }) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
        {title}
      </div>
      <div className="text-xl font-semibold text-slate-50">
        {value}
      </div>
    </div>
  );
}

function formatCurrency(amount) {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(parseFloat(amount));
}

// Ventas por día
function buildSalesByDay(orders) {
  const map = new Map();

  for (const order of orders) {
    if (!order.created_at) continue;
    const dateObj = new Date(order.created_at);
    const day = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
    const total = parseFloat(order.total_price || 0);
    const prev = map.get(day) || 0;
    map.set(day, prev + (isNaN(total) ? 0 : total));
  }

  return Array.from(map.entries())
    .map(([date, total]) => ({ date, total: Number(total.toFixed(2)) }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

// Crecimiento acumulado del catálogo
function buildCatalogGrowth(products) {
  const perDay = new Map();

  for (const p of products) {
    if (!p.created_at) continue;
    const day = new Date(p.created_at).toISOString().slice(0, 10);
    const prev = perDay.get(day) || 0;
    perDay.set(day, prev + 1);
  }

  const sorted = Array.from(perDay.entries()).sort((a, b) =>
    a[0] > b[0] ? 1 : -1
  );

  let cumulative = 0;
  return sorted.map(([date, count]) => {
    cumulative += count;
    return { date, count: cumulative };
  });
}

// Crecimiento acumulado de leads/clientes
function buildLeadsGrowth(customers) {
  const perDay = new Map();

  for (const c of customers) {
    if (!c.created_at) continue;
    const day = new Date(c.created_at).toISOString().slice(0, 10);
    const prev = perDay.get(day) || 0;
    perDay.set(day, prev + 1);
  }

  const sorted = Array.from(perDay.entries()).sort((a, b) =>
    a[0] > b[0] ? 1 : -1
  );

  let cumulative = 0;
  return sorted.map(([date, count]) => {
    cumulative += count;
    return { date, count: cumulative };
  });
}

export default async function OverviewPage() {
  let products = [];
  let orders = [];
  let customers = [];

  try {
    products = await getProducts();
    orders = await getOrders();
    customers = await getCustomers();
  } catch (error) {
    console.error(error);
  }

  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalLeads = customers.length;

  const totalSales = orders.reduce((sum, order) => {
    const n = parseFloat(order.total_price || 0);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const salesByDay = buildSalesByDay(orders);
  const catalogGrowth = buildCatalogGrowth(products);
  const leadsGrowth = buildLeadsGrowth(customers);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Overview
      </h1>
      <p className="text-sm text-slate-400 mb-6 max-w-xl">
        Resumen general de productos, ventas y leads conectado en tiempo real con Shopify.
      </p>

      {/* KPIs principales */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card title="Productos activos" value={totalProducts} />
        <Card title="Órdenes totales (muestra)" value={totalOrders} />
        <Card title="Leads totales (muestra)" value={totalLeads} />
        <Card
          title="Ventas totales (muestra)"
          value={formatCurrency(totalSales)}
        />
      </div>

      {/* Estado de la tienda */}
      <div className="mb-6">
        <Card
          title="Estado"
          value={totalOrders > 0 ? 'Tienda en marcha' : 'En preparación'}
        />
      </div>

      {/* Gráficas */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Tendencia de ventas (resumen)
            </h2>
            <span className="text-xs text-slate-500">
              Ventas agregadas por día
            </span>
          </div>
          <OverviewSalesChart data={salesByDay} />
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Crecimiento del catálogo
            </h2>
            <span className="text-xs text-slate-500">
              Productos acumulados en el tiempo
            </span>
          </div>
          <CatalogGrowthChart data={catalogGrowth} />
        </div>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Crecimiento de leads
          </h2>
          <span className="text-xs text-slate-500">
            Clientes/leads acumulados en el tiempo
          </span>
        </div>
        <LeadsGrowthChart data={leadsGrowth} />
      </div>
    </div>
  );
}
