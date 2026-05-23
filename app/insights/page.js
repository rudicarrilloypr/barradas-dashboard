import { getOrders, getProducts, getCustomers } from '../../src/lib/shopify';
import InsightsPdfButton from '../../app/components/InsightsPdfButton';
import RangeSelect from '../../app/components/RangeSelect';

export const dynamic = 'force-dynamic';

const LOW_STOCK_THRESHOLD = 3;

function Card({ title, value, description }) {
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

function formatCurrency(amount) {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(parseFloat(amount));
}

function getRangeLabel(value) {
  switch (value) {
    case '90d':
      return 'Ultimos 90 dias';
    case 'ytd':
      return 'Ano en curso';
    case 'all':
      return 'Todo el historial';
    case '30d':
    default:
      return 'Ultimos 30 dias';
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
      from = null;
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

function getOrderTotal(order) {
  const total = parseFloat(order.total_price || 0);
  return isNaN(total) ? 0 : total;
}

function getInventoryTotal(product) {
  return (product.variants || []).reduce((sum, variant) => {
    const quantity = Number(variant.inventory_quantity || 0);
    return sum + (isNaN(quantity) ? 0 : quantity);
  }, 0);
}

function hasProductImage(product) {
  return Boolean(product.image || (product.images || []).length > 0);
}

function getProductPrice(product) {
  const prices = (product.variants || [])
    .map((variant) => parseFloat(variant.price || 0))
    .filter((price) => !isNaN(price) && price > 0);

  return prices.length ? Math.min(...prices) : 0;
}

function getProductIssues(product) {
  const issues = [];
  const stock = getInventoryTotal(product);

  if (!hasProductImage(product)) issues.push('sin imagen');
  if (!product.product_type) issues.push('sin tipo');
  if (getProductPrice(product) <= 0) issues.push('sin precio');
  if (product.status === 'active' && stock <= 0) issues.push('sin stock');
  else if (product.status === 'active' && stock <= LOW_STOCK_THRESHOLD) issues.push('stock bajo');
  if (product.status !== 'active') issues.push('no activo');

  return issues;
}

function hasEmail(customer) {
  return Boolean(customer.email);
}

function hasPhone(customer) {
  return Boolean(customer.phone || customer.default_address?.phone);
}

function getLeadIssues(customer) {
  const issues = [];
  if (!hasEmail(customer)) issues.push('sin email');
  if (!hasPhone(customer)) issues.push('sin telefono');
  if (!customer.first_name && !customer.last_name) issues.push('sin nombre');
  return issues;
}

function buildTypeRows(products) {
  const map = new Map();

  for (const product of products) {
    const type = product.product_type || 'Sin tipo';
    map.set(type, (map.get(type) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function buildLeadMonthRows(customers) {
  const map = new Map();

  for (const customer of customers) {
    if (!customer.created_at) continue;
    const month = new Date(customer.created_at).toISOString().slice(0, 7);
    map.set(month, (map.get(month) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => (a.label > b.label ? 1 : -1))
    .slice(-6);
}

function buildTopProductsByRevenue(orders, limit = 5) {
  const map = new Map();

  for (const order of orders) {
    for (const item of order.line_items || []) {
      const key = item.product_id || item.title;
      const quantity = Number(item.quantity || 0);
      const price = parseFloat(item.price || 0);
      const revenue = (isNaN(price) ? 0 : price) * quantity;
      const current = map.get(key) || {
        title: item.title || 'Producto sin nombre',
        quantity: 0,
        revenue: 0,
      };

      current.quantity += quantity;
      current.revenue += revenue;
      map.set(key, current);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

function getDecisionRows({
  filteredOrders,
  productsWithIssues,
  activeProducts,
  incompleteLeads,
  contactableLeads,
  totalLeads,
}) {
  const rows = [];

  if (filteredOrders.length === 0) {
    rows.push({
      area: 'Ventas',
      priority: 'Alta',
      insight: 'La tienda aun no registra ordenes en el rango seleccionado.',
      action: 'Probar checkout, metodos de pago y primer flujo de compra antes de activar campanas.',
    });
  } else {
    rows.push({
      area: 'Ventas',
      priority: 'Alta',
      insight: `${filteredOrders.length} ordenes registradas en el rango.`,
      action: 'Revisar ticket promedio, productos lider y pagos pendientes cada semana.',
    });
  }

  if (productsWithIssues.length > 0) {
    rows.push({
      area: 'Catalogo',
      priority: 'Media',
      insight: `${productsWithIssues.length} productos tienen datos incompletos o alertas.`,
      action: 'Completar imagen, tipo, precio o stock antes de invertir trafico.',
    });
  } else {
    rows.push({
      area: 'Catalogo',
      priority: 'Baja',
      insight: `${activeProducts.length} productos activos sin alertas criticas detectadas.`,
      action: 'Mantener revision semanal de stock y nuevos productos.',
    });
  }

  if (totalLeads > 0 && incompleteLeads.length > 0) {
    rows.push({
      area: 'Leads',
      priority: 'Media',
      insight: `${incompleteLeads.length} leads tienen datos incompletos.`,
      action: 'Priorizar limpieza de email/telefono para seguimiento comercial.',
    });
  } else if (totalLeads > 0) {
    rows.push({
      area: 'Leads',
      priority: 'Baja',
      insight: `${contactableLeads.length} leads contactables disponibles.`,
      action: 'Preparar rutina de seguimiento y segmentacion.',
    });
  }

  return rows;
}

export default async function InsightsPage({ searchParams }) {
  const sp = await searchParams;
  const range = (sp?.get ? sp.get('range') : sp?.range) || '30d';
  const rangeLabel = getRangeLabel(range);

  let orders = [];
  let products = [];
  let customers = [];

  try {
    [orders, products, customers] = await Promise.all([
      getOrders(),
      getProducts(),
      getCustomers(),
    ]);
  } catch (error) {
    console.error(error);
  }

  const filteredOrders = filterByDate(orders, range, 'created_at');
  const filteredCustomers = filterByDate(customers, range, 'created_at');
  const activeProducts = products.filter((product) => product.status === 'active');
  const productsWithIssues = products.filter(
    (product) => getProductIssues(product).length > 0
  );
  const incompleteLeads = filteredCustomers.filter(
    (customer) => getLeadIssues(customer).length > 0
  );
  const contactableLeads = filteredCustomers.filter(
    (customer) => hasEmail(customer) || hasPhone(customer)
  );
  const totalSales = filteredOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );
  const averageOrderValue = filteredOrders.length > 0
    ? totalSales / filteredOrders.length
    : 0;
  const topProducts = buildTopProductsByRevenue(filteredOrders);
  const typeRows = buildTypeRows(products);
  const leadMonthRows = buildLeadMonthRows(customers);
  const decisionRows = getDecisionRows({
    filteredOrders,
    productsWithIssues,
    activeProducts,
    incompleteLeads,
    contactableLeads,
    totalLeads: filteredCustomers.length,
  });
  const executiveSummary =
    filteredOrders.length > 0
      ? `Ventas activas: ${filteredOrders.length} ordenes, ${formatCurrency(totalSales)} vendidos y ticket promedio de ${formatCurrency(averageOrderValue)}.`
      : `La tienda esta lista en catalogo (${activeProducts.length} productos activos), pero aun no registra ventas en ${rangeLabel.toLowerCase()}.`;

  const report = {
    generatedAt: new Date().toLocaleString('es-MX'),
    rangeLabel,
    executiveSummary,
    totalSales,
    totalOrders: filteredOrders.length,
    averageOrderValue,
    activeProducts: activeProducts.length,
    productsWithIssues: productsWithIssues.length,
    totalLeads: filteredCustomers.length,
    contactableLeads: contactableLeads.length,
    incompleteLeads: incompleteLeads.length,
    decisionRows,
    topProducts,
    typeRows,
    leadMonthRows,
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Inteligencia
      </h1>
      <p className="text-sm text-slate-400 mb-2 max-w-2xl">
        Resumen ejecutivo para decisiones comerciales: ventas, catalogo, leads y acciones recomendadas.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <RangeSelect />
        <InsightsPdfButton report={report} />
      </div>

      <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-slate-100 mb-2">
          Lectura ejecutiva
        </h2>
        <p className="text-sm text-slate-300">
          {executiveSummary}
        </p>
      </section>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card title="Ventas" value={formatCurrency(totalSales)} description={`${filteredOrders.length} ordenes · ${rangeLabel}`} />
        <Card title="Ticket promedio" value={formatCurrency(averageOrderValue)} description="Venta promedio por orden" />
        <Card title="Catalogo activo" value={activeProducts.length} description={`${productsWithIssues.length} productos con alertas`} />
        <Card title="Leads contactables" value={contactableLeads.length} description={`${incompleteLeads.length} incompletos en el rango`} />
      </div>

      <section className="mb-6 bg-slate-950/90 border border-slate-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">
          Acciones recomendadas
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="px-4 py-2 text-left text-slate-300">Area</th>
                <th className="px-4 py-2 text-left text-slate-300">Prioridad</th>
                <th className="px-4 py-2 text-left text-slate-300">Lectura</th>
                <th className="px-4 py-2 text-left text-slate-300">Accion sugerida</th>
              </tr>
            </thead>
            <tbody>
              {decisionRows.map((row) => (
                <tr key={`${row.area}-${row.priority}`} className="border-b border-slate-900/60">
                  <td className="px-4 py-2 text-slate-100">{row.area}</td>
                  <td className="px-4 py-2 text-slate-300">{row.priority}</td>
                  <td className="px-4 py-2 text-slate-300">{row.insight}</td>
                  <td className="px-4 py-2 text-slate-400">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-6">
        <section className="bg-slate-950/90 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Mix de catalogo
          </h2>
          {typeRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-sm">
              <span className="text-slate-100">{row.label}</span>
              <span className="text-slate-400">{row.value} productos</span>
            </div>
          ))}
        </section>

        <section className="bg-slate-950/90 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Captacion de leads
          </h2>
          {leadMonthRows.length === 0 ? (
            <div className="text-sm text-slate-500">
              No hay historial de leads para mostrar.
            </div>
          ) : (
            leadMonthRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-sm">
                <span className="text-slate-100">{row.label}</span>
                <span className="text-slate-400">{row.value} leads</span>
              </div>
            ))
          )}
        </section>
      </div>

      <section className="bg-slate-950/90 border border-slate-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">
          Top productos por ingresos
        </h2>
        {topProducts.length === 0 ? (
          <div className="text-sm text-slate-500">
            Aun no hay ordenes suficientes para calcular productos mas vendidos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-slate-900 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-300">Producto</th>
                  <th className="px-4 py-2 text-left text-slate-300">Unidades</th>
                  <th className="px-4 py-2 text-left text-slate-300">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.title} className="border-b border-slate-900/60">
                    <td className="px-4 py-2 text-slate-100">{product.title}</td>
                    <td className="px-4 py-2 text-slate-300">{product.quantity}</td>
                    <td className="px-4 py-2 text-slate-200">{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
