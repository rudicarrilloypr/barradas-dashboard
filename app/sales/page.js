import { getOrders } from '../../src/lib/shopify';
import Pagination from '../../app/components/Pagination';
import RangeSelect from '../../app/components/RangeSelect';
import SalesChart from '../../app/components/charts/SalesChart';

const PAGE_SIZE = 10;

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

function getProblemOrders(orders) {
  return orders.filter((order) =>
    order.cancelled_at ||
    ['refunded', 'partially_refunded', 'voided'].includes(order.financial_status)
  );
}

function getCustomerName(order) {
  if (!order.customer) return 'Sin cliente';

  return `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() ||
    order.customer.email ||
    'Sin cliente';
}

function buildSalesByDay(orders) {
  const map = new Map();

  for (const order of orders) {
    if (!order.created_at) continue;
    const day = new Date(order.created_at).toISOString().slice(0, 10);
    const prev = map.get(day) || 0;
    map.set(day, prev + getOrderTotal(order));
  }

  return Array.from(map.entries())
    .map(([date, total]) => ({ date, total: Number(total.toFixed(2)) }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

function buildTopProducts(orders, limit = 5) {
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

function buildStatusRows(orders) {
  const map = new Map();

  for (const order of orders) {
    const status = order.financial_status || 'sin_estado';
    const current = map.get(status) || { status, count: 0, total: 0 };
    current.count += 1;
    current.total += getOrderTotal(order);
    map.set(status, current);
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function getBestDay(salesByDay) {
  if (salesByDay.length === 0) return null;
  return [...salesByDay].sort((a, b) => b.total - a.total)[0];
}

export default async function SalesPage({ searchParams }) {
  const sp = await searchParams;
  const range = (sp?.get ? sp.get('range') : sp?.range) || '30d';
  const pageParam = (sp?.get ? sp.get('page') : sp?.page) || '1';
  const rangeLabel = getRangeLabel(range);

  let orders = [];

  try {
    orders = await getOrders();
  } catch (error) {
    console.error(error);
  }

  const filteredOrders = filterByDate(orders, range, 'created_at');
  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  const paidOrders = getPaidOrders(filteredOrders);
  const pendingOrders = getPendingOrders(filteredOrders);
  const problemOrders = getProblemOrders(filteredOrders);
  const salesByDay = buildSalesByDay(filteredOrders);
  const topProducts = buildTopProducts(filteredOrders);
  const statusRows = buildStatusRows(filteredOrders);
  const bestDay = getBestDay(salesByDay);

  const total = filteredOrders.length;
  const page = parseInt(pageParam, 10);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(page || 1, 1), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pageItems = sortedOrders.slice(startIndex, endIndex);

  const totalSales = filteredOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );
  const paidSales = paidOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );
  const averageOrderValue = total > 0 ? totalSales / total : 0;
  const topProduct = topProducts[0];
  const commercialSummary =
    total > 0
      ? `${total} ordenes en ${rangeLabel.toLowerCase()}, ${formatCurrency(totalSales)} vendidos y ticket promedio de ${formatCurrency(averageOrderValue)}.`
      : `No hay ordenes en ${rangeLabel.toLowerCase()}. Si la tienda ya vendio antes, revisa si hace falta el scope read_all_orders.`;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Sales
      </h1>
      <p className="text-sm text-slate-400 mb-2 max-w-xl">
        Ventas, pagos y productos vendidos desde Shopify para seguimiento comercial.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <RangeSelect />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card title="Ventas totales" value={formatCurrency(totalSales)} detail={rangeLabel} />
        <Card title="Ventas pagadas" value={formatCurrency(paidSales)} detail={`${paidOrders.length} ordenes pagadas o parciales`} />
        <Card title="Ordenes" value={total} detail={rangeLabel} />
        <Card title="Ticket promedio" value={formatCurrency(averageOrderValue)} detail="Venta promedio por orden" />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card title="Pagos pendientes" value={pendingOrders.length} detail="Pendientes, autorizadas o parciales" />
        <Card title="Alertas de venta" value={problemOrders.length} detail="Canceladas, reembolsadas o anuladas" />
        <Card
          title="Producto lider"
          value={topProduct ? topProduct.title : 'Sin datos'}
          detail={topProduct ? `${topProduct.quantity} unidades vendidas` : 'Aun no hay ventas para ranking'}
        />
        <Card
          title="Mejor dia"
          value={bestDay ? bestDay.date : 'Sin datos'}
          detail={bestDay ? formatCurrency(bestDay.total) : commercialSummary}
        />
      </div>

      <section className="mb-6 bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Tendencia diaria de ventas
          </h2>
          <span className="text-xs text-slate-500">
            {rangeLabel}
          </span>
        </div>
        <SalesChart data={salesByDay} />
      </section>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-6">
        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Top productos vendidos
          </h2>
          {topProducts.length === 0 ? (
            <div className="text-sm text-slate-500">
              Aun no hay productos vendidos en este rango.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-slate-950 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-slate-300">Producto</th>
                    <th className="px-4 py-2 text-left text-slate-300">Unidades</th>
                    <th className="px-4 py-2 text-left text-slate-300">Ingreso</th>
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

        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Estado financiero de ordenes
          </h2>
          {statusRows.length === 0 ? (
            <div className="text-sm text-slate-500">
              No hay estados financieros para mostrar en este rango.
            </div>
          ) : (
            <div className="space-y-3">
              {statusRows.map((row) => (
                <div key={row.status} className="flex items-center justify-between border-b border-slate-800 pb-2 text-sm">
                  <div>
                    <div className="capitalize text-slate-100">{row.status.replaceAll('_', ' ')}</div>
                    <div className="text-xs text-slate-500">{row.count} ordenes</div>
                  </div>
                  <div className="text-slate-200">{formatCurrency(row.total)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Ordenes recientes
            </h2>
            <p className="text-xs text-slate-500">
              {commercialSummary}
            </p>
          </div>
          {total > 0 && (
            <div className="text-xs text-slate-500">
              Mostrando <span className="text-slate-100 font-medium">{startIndex + 1}-{Math.min(endIndex, total)}</span> de <span className="text-slate-100 font-medium">{total}</span>
            </div>
          )}
        </div>

        {total === 0 ? (
          <div className="text-sm text-slate-500 bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            No se encontraron ordenes en este rango. Si esperabas ver ventas historicas,
            confirma que Shopify tenga aprobados read_orders y, para mas de 60 dias,
            read_all_orders.
          </div>
        ) : (
          <>
            <div className="border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[780px]">
                <thead className="bg-slate-900 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-slate-300">Orden</th>
                    <th className="px-4 py-2 text-left text-slate-300">Cliente</th>
                    <th className="px-4 py-2 text-left text-slate-300">Total</th>
                    <th className="px-4 py-2 text-left text-slate-300">Pago</th>
                    <th className="px-4 py-2 text-left text-slate-300">Fulfillment</th>
                    <th className="px-4 py-2 text-left text-slate-300">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((order) => (
                    <tr key={order.id} className="border-b border-slate-900/60">
                      <td className="px-4 py-2 text-slate-200">{order.name}</td>
                      <td className="px-4 py-2 text-slate-300">{getCustomerName(order)}</td>
                      <td className="px-4 py-2 text-slate-200">{formatCurrency(order.total_price)}</td>
                      <td className="px-4 py-2 text-slate-400 capitalize">{order.financial_status?.replaceAll('_', ' ') || '-'}</td>
                      <td className="px-4 py-2 text-slate-400 capitalize">{order.fulfillment_status?.replaceAll('_', ' ') || 'sin fulfillment'}</td>
                      <td className="px-4 py-2 text-slate-500 text-xs">{new Date(order.created_at).toLocaleString('es-MX')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={safePage}
              totalPages={totalPages}
              basePath="/sales"
              query={{ range: range === '30d' ? '' : range }}
            />
          </>
        )}
      </section>
    </div>
  );
}
