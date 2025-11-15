import { getOrders } from '../../src/lib/shopify';
import Pagination from '../../app/components/Pagination';

const PAGE_SIZE = 10;

function formatCurrency(amount) {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(parseFloat(amount));
}

export default async function SalesPage({ searchParams }) {
  let orders = [];

  try {
    orders = await getOrders();
  } catch (error) {
    console.error(error);
  }

  const total = orders.length;
  const page = parseInt(searchParams?.page || "1", 10);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const pageItems = orders.slice(startIndex, endIndex);

  const totalSales = orders.reduce((sum, order) => {
    const n = parseFloat(order.total_price || 0);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Sales
      </h1>
      <p className="text-sm text-slate-400 mb-4">
        Órdenes recientes obtenidas desde Shopify.
      </p>

      <div className="mb-4 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Ventas totales (muestra actual)
          </div>
          <div className="text-xl font-semibold text-slate-50">
            {formatCurrency(totalSales)}
          </div>
        </div>
        <div className="text-sm text-slate-400">
          Órdenes listadas:{" "}
          <span className="text-slate-100">{total}</span>
        </div>
      </div>

      {total === 0 ? (
        <div className="text-sm text-slate-500">
          No se encontraron órdenes.  
          (Puede ser que todavía no haya ventas en la tienda o que falten permisos de lectura de órdenes.)
        </div>
      ) : (
        <>
          <div className="text-xs text-slate-500 mb-2">
            Mostrando{" "}
            <span className="text-slate-100 font-medium">
              {startIndex + 1}–{Math.min(endIndex, total)}
            </span>{" "}
            de{" "}
            <span className="text-slate-100 font-medium">{total}</span>{" "}
            órdenes.
          </div>

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
                {pageItems.map((o) => (
                  <tr key={o.id} className="border-b border-slate-900/60">
                    <td className="px-4 py-2 text-slate-200">{o.name}</td>
                    <td className="px-4 py-2 text-slate-300">
                      {o.customer
                        ? `${o.customer.first_name || ""} ${
                            o.customer.last_name || ""
                          }`.trim() || "—"
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-200">
                      {formatCurrency(o.total_price)}
                    </td>
                    <td className="px-4 py-2 text-slate-400 capitalize">
                      {o.financial_status || "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-500 text-xs">
                      {new Date(o.created_at).toLocaleString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            basePath="/sales"
          />
        </>
      )}
    </div>
  );
}
