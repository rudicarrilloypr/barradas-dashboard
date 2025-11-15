// src/app/leads/page.js
import { getCustomers } from '../../src/lib/shopify';

export default async function LeadsPage() {
  let customers = [];

  try {
    customers = await getCustomers();
  } catch (error) {
    console.error(error);
  }

  // Ordenar por fecha de creación (más nuevos primero)
  customers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Leads
      </h1>
      <p className="text-sm text-slate-400 mb-4">
        Clientes y contactos obtenidos desde Shopify. Cada cliente representa un lead potencial para seguimiento comercial.
      </p>

      <div className="mb-4 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Total de leads
          </div>
          <div className="text-xl font-semibold text-slate-50">
            {customers.length}
          </div>
        </div>
        <div className="text-xs text-slate-500">
          * Incluye clientes que han generado cuenta, compra o han dejado su correo.
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="text-sm text-slate-500">
          No se encontraron leads aún.  
          (Cuando haya clientes o registros en la tienda, aparecerán aquí automáticamente.)
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="px-4 py-2 text-left text-slate-300">Nombre</th>
                <th className="px-4 py-2 text-left text-slate-300">Email</th>
                <th className="px-4 py-2 text-left text-slate-300">Teléfono</th>
                <th className="px-4 py-2 text-left text-slate-300">País</th>
                <th className="px-4 py-2 text-left text-slate-300">Fecha creación</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-slate-900/60">
                  <td className="px-4 py-2 text-slate-100">
                    {`${c.first_name || ''} ${c.last_name || ''}`.trim() || '—'}
                  </td>
                  <td className="px-4 py-2 text-slate-300">
                    {c.email || '—'}
                  </td>
                  <td className="px-4 py-2 text-slate-400">
                    {c.phone || '—'}
                  </td>
                  <td className="px-4 py-2 text-slate-400">
                    {c.default_address?.country || '—'}
                  </td>
                  <td className="px-4 py-2 text-slate-500 text-xs">
                    {new Date(c.created_at).toLocaleString('es-MX')}
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
