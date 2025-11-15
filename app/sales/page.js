// src/app/sales/page.js
import { getOrders } from '../../src/lib/shopify';
import SalesChart from '../../app/components/charts/SalesChart';

function formatCurrency(amount) {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(parseFloat(amount));
}

function buildSalesByDay(orders) {
  // Agrupar por fecha (YYYY-MM-DD)
  const map = new Map();

  for (const order of orders) {
    if (!order.created_at) continue;
    const dateObj = new Date(order.created_at);
    const day = dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const total = parseFloat(order.total_price || 0);
    const prev = map.get(day) || 0;
    map.set(day, prev + (isNaN(total) ? 0 : total));
  }

  // Convertir a array ordenado por fecha
  const result = Array.from(map.entries())
    .map(([date, total]) => ({ date, total: Number(total.toFixed(2)) }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  return result;
}

export default async function SalesPage() {
  let orders = [];

  try {
    orders = await getOrders();
  } catch (error) {
    console.error(error);
  }

  const totalSales = orders.reduce((sum, order) => {
    const n = parseFloat(order.total_price || 0);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const salesByDay = buildSalesByDay(orders);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Sales
      </h1>
      <p className="text-sm text-slate-400 mb-4">
        Órdenes recientes obtenidas desde Shopify, con resumen de ventas por día.
      </p>

      {/* Resumen */}
      <div className="mb-6 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Ventas totales (muestra actual)
          </div>
          <div className="text-xl font-semibold text-slate-50">
            {formatCurrency(totalSales)}
          </div>
        </div>
        <div className="text-sm text-slate-400">
          Órdenes listadas:{' '}
          <span className="text-slate-100 font-medium">{orders.length}</span>
        </div>
      </div>

      {/* Gráfica */}
      <div className="mb-8 bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Ventas por día
          </h2>
          <span className="text-xs text-slate-500">
            Datos agregados por fecha de orden
          </span>
        </div>
        <SalesChart data={salesByDay} />
      </div>

      {/* Tabla (si ya la tenías, déjala, solo la pegamos debajo) */}
      {orders.length === 0 ? (
        <div className="text-sm text-slate-500">
          No se encontraron órdenes.  
          (Puede ser que todavía no haya ventas en la tienda o que falten permisos de lectura de órdenes.)
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="px-4 py-2 text-left text-slate-300">ID</th>
                <th className="px-4 py-2 text-left text-slate-300">Cliente</th>
                <th className="px-4 py-2 text-left text-slate-300">Total</th>
                <th className="px-4 py-2 text-left text-slate-300">Estado</th>
                <th className="px-4 py-2 text-left text-slate-300">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-900/60">
                  <td className="px-4 py-2 text-slate-200">{o.name}</td>
                  <td className="px-4 py-2 text-slate-300">
                    {o.customer
                      ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim() ||
                        '—'
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-slate-200">
                    {formatCurrency(o.total_price)}
                  </td>
                  <td className="px-4 py-2 text-slate-400 capitalize">
                    {o.financial_status || '—'}
                  </td>
                  <td className="px-4 py-2 text-slate-500 text-xs">
                    {new Date(o.created_at).toLocaleString('es-MX')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
