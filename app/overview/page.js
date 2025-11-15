import { getProducts, getOrders } from '../../src/lib/shopify';
import OverviewSalesChart from '../../app/components/charts/OverviewSalesChart';

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

function buildSalesByDay(orders) {
  const map = new Map();

  for (const order of orders) {
    if (!order.created_at) continue;
    const dateObj = new Date(order.created_at);
    const day = dateObj.toISOString().slice(0, 10);
    const total = parseFloat(order.total_price || 0);
    const prev = map.get(day) || 0;
    map.set(day, prev + (isNaN(total) ? 0 : total));
  }

  return Array.from(map.entries())
    .map(([date, total]) => ({ date, total: Number(total.toFixed(2)) }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

export default async function OverviewPage() {
  let products = [];
  let orders = [];

  try {
    products = await getProducts();
    orders = await getOrders();
  } catch (error) {
    console.error(error);
  }

  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, order) => {
    const n = parseFloat(order.total_price || 0);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const salesByDay = buildSalesByDay(orders);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Overview
      </h1>
      <p className="text-sm text-slate-400 mb-6 max-w-xl">
        Resumen general de productos y ventas conectado en tiempo real con Shopify.
      </p>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card title="Productos activos" value={totalProducts} />
        <Card title="Órdenes totales (muestra)" value={totalOrders} />
        <Card title="Ventas totales (muestra)" value={formatCurrency(totalSales)} />
        <Card
          title="Estado"
          value={totalOrders > 0 ? 'Tienda en marcha' : 'En preparación'}
        />
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Tendencia de ventas (resumen)
          </h2>
          <span className="text-xs text-slate-500">
            Vista rápida de las ventas por día
          </span>
        </div>
        <OverviewSalesChart data={salesByDay} />
      </div>
    </div>
  );
}
