// src/app/overview/page.js
import { getProducts, getOrders, getCustomers } from '../../src/lib/shopify';
import OverviewSalesChart from '../../app/components/charts/OverviewSalesChart';
import CatalogGrowthChart from '../../app/components/charts/CatalogGrowthChart';
import LeadsGrowthChart from '../../app/components/charts/LeadsGrowthChart';
import OverviewPdfButton from '../../app/components/OverviewPdfButton';
import RangeSelect from '../../app/components/RangeSelect';

function Card({ title, value, detail }) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
        {title}
      </div>
      <div className="text-xl font-semibold text-slate-50">
        {value}
      </div>
      {detail && (
        <div className="text-xs text-slate-500 mt-2">
          {detail}
        </div>
      )}
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

// 🔹 AQUÍ va getRangeLabel, a nivel de módulo
function getRangeLabel(value) {
  switch (value) {
    case '90d':
      return 'Últimos 90 días';
    case 'ytd':
      return 'Año en curso';
    case 'all':
      return 'Todo el historial';
    case '30d':
    default:
      return 'Últimos 30 días';
  }
}

function getRangeDates(range) {
  const now = new Date();
  let from = null;

  switch (range) {
    case '90d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      from = d;
      break;
    }
    case 'ytd': {
      const d = new Date(now.getFullYear(), 0, 1);
      from = d;
      break;
    }
    case 'all':
      from = null; // sin límite inferior
      break;
    case '30d':
    default: {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      from = d;
      break;
    }
  }

  return { from, to: now };
}

function filterByDate(items, range, field = 'created_at') {
  const { from, to } = getRangeDates(range);
  if (!from) return items;

  return items.filter((item) => {
    const raw = item[field];
    if (!raw) return false;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return false;
    return d >= from && d <= to;
  });
}

// Ventas por día
function filterActiveProducts(products) {
  return products.filter((product) => product.status === 'active');
}

function getPaidOrders(orders) {
  return orders.filter((order) =>
    ['paid', 'partially_paid'].includes(order.financial_status)
  );
}

function getPendingOrders(orders) {
  return orders.filter((order) =>
    ['pending', 'authorized', 'partially_paid'].includes(order.financial_status)
  );
}

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

// Crecimiento acumulado de leads
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

export default async function OverviewPage({ searchParams }) {
  // 👇 desempaquetar el Promise
  const sp = await searchParams;

  // si viene como URLSearchParams:
  const range = (sp?.get ? sp.get('range') : sp?.range) || '30d';
  const rangeLabel = getRangeLabel(range);

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

  // Filtrar por rango
  const filteredOrders = filterByDate(orders, range, 'created_at');
  const filteredCustomers = filterByDate(customers, range, 'created_at');
  const filteredProducts = filterByDate(
    filterActiveProducts(products),
    range,
    'created_at'
  );

  const activeProducts = filterActiveProducts(products);
  const paidOrders = getPaidOrders(filteredOrders);
  const pendingOrders = getPendingOrders(filteredOrders);
  const totalProducts = filteredProducts.length;
  const activeProductsTotal = activeProducts.length;
  const totalOrders = filteredOrders.length;
  const totalLeads = filteredCustomers.length;

  const totalSales = filteredOrders.reduce((sum, order) => {
    const n = parseFloat(order.total_price || 0);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  const paidSales = paidOrders.reduce((sum, order) => {
    const n = parseFloat(order.total_price || 0);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const salesByDay = buildSalesByDay(filteredOrders);
  const catalogGrowth = buildCatalogGrowth(filteredProducts);
  const leadsGrowth = buildLeadsGrowth(filteredCustomers);

  // Datos para el PDF
  const generatedAt = new Date().toLocaleString('es-MX');

  const report = {
    generatedAt,
    totalProducts,
    totalOrders,
    totalLeads,
    totalSales,
    salesByDay,
    catalogGrowth,
    leadsGrowth,
    rangeLabel,
  };

  const commercialSummary =
    totalOrders > 0
      ? `${totalOrders} ordenes en ${rangeLabel.toLowerCase()}, ticket promedio de ${formatCurrency(averageOrderValue)} y ${pendingOrders.length} ordenes con pago pendiente o parcial.`
      : `Catalogo conectado con ${activeProductsTotal} productos activos y ${totalLeads} leads en ${rangeLabel.toLowerCase()}. Aun no hay ventas en este rango.`;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Overview
      </h1>
      <p className="text-sm text-slate-400 mb-2 max-w-xl">
        Resumen general de productos, ventas y leads conectado en tiempo real con Shopify.
      </p>

      {/* Select de rango + botón PDF */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <RangeSelect />
        <OverviewPdfButton report={report} />
      </div>

      {/* KPIs principales */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card
          title="Productos activos"
          value={activeProductsTotal}
          detail={
            range === 'all'
              ? 'Catalogo activo completo'
              : `${totalProducts} creados en ${rangeLabel.toLowerCase()}`
          }
        />
        <Card title="Ordenes" value={totalOrders} detail={rangeLabel} />
        <Card title="Leads" value={totalLeads} detail={rangeLabel} />
        <Card
          title="Ventas totales"
          value={formatCurrency(totalSales)}
          detail={rangeLabel}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card
          title="Ventas pagadas"
          value={formatCurrency(paidSales)}
          detail={`${paidOrders.length} ordenes pagadas o parciales`}
        />
        <Card
          title="Ticket promedio"
          value={formatCurrency(averageOrderValue)}
          detail="Venta promedio por orden"
        />
        <Card
          title="Pagos pendientes"
          value={pendingOrders.length}
          detail="Pendientes, autorizadas o parciales"
        />
        <Card
          title="Lectura comercial"
          value={totalOrders > 0 ? 'Ventas activas' : 'Sin ventas en rango'}
          detail={commercialSummary}
        />
      </div>

      {/* Estado de la tienda */}
      <div className="mb-6">
        <Card
          title="Estado comercial"
          value={totalOrders > 0 ? 'Ventas activas' : 'Catalogo listo'}
          detail={totalOrders > 0 ? rangeLabel : 'Esperando primeras ventas registradas'}
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
              Ventas agregadas por día ({rangeLabel.toLowerCase()})
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
              Productos acumulados en el tiempo ({rangeLabel.toLowerCase()})
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
            Clientes/leads acumulados en el tiempo ({rangeLabel.toLowerCase()})
          </span>
        </div>
        <LeadsGrowthChart data={leadsGrowth} />
      </div>
    </div>
  );
}
