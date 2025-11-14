import { getProducts, getOrders } from '../../src/lib/shopify';

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
        <Card title="Estado" value={totalOrders > 0 ? 'Tienda en marcha' : 'En preparación'} />
      </div>

      <p className="text-xs text-slate-500">
        * Los datos se actualizan en tiempo real desde la API de Shopify.
      </p>
    </div>
  );
}
