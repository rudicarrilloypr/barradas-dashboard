// src/app/leads/page.js
import { getCustomers } from '../../src/lib/shopify';

export const dynamic = 'force-dynamic';

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

function getCustomerName(customer) {
  return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
    customer.email ||
    customer.phone ||
    'Sin nombre';
}

function hasEmail(customer) {
  return Boolean(customer.email);
}

function hasPhone(customer) {
  return Boolean(customer.phone || customer.default_address?.phone);
}

function isContactable(customer) {
  return hasEmail(customer) || hasPhone(customer);
}

function getLeadIssues(customer) {
  const issues = [];

  if (!hasEmail(customer)) issues.push('Sin email');
  if (!hasPhone(customer)) issues.push('Sin telefono');
  if (!customer.first_name && !customer.last_name) issues.push('Sin nombre');
  if (!customer.default_address?.country) issues.push('Sin pais');

  return issues;
}

function buildLeadsByMonth(customers) {
  const map = new Map();

  for (const customer of customers) {
    if (!customer.created_at) continue;
    const month = new Date(customer.created_at).toISOString().slice(0, 7);
    map.set(month, (map.get(month) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => (a.month > b.month ? 1 : -1));
}

function buildCountryRows(customers) {
  const map = new Map();

  for (const customer of customers) {
    const country = customer.default_address?.country || 'Sin pais';
    map.set(country, (map.get(country) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export default async function LeadsPage() {
  let customers = [];

  try {
    customers = await getCustomers();
  } catch (error) {
    console.error(error);
  }

  const sortedCustomers = [...customers].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  const contactable = sortedCustomers.filter(isContactable);
  const withEmail = sortedCustomers.filter(hasEmail);
  const withPhone = sortedCustomers.filter(hasPhone);
  const incomplete = sortedCustomers.filter(
    (customer) => getLeadIssues(customer).length > 0
  );
  const leadsByMonth = buildLeadsByMonth(sortedCustomers);
  const countryRows = buildCountryRows(sortedCustomers);
  const latestMonth = leadsByMonth[leadsByMonth.length - 1];
  const previousMonth = leadsByMonth[leadsByMonth.length - 2];
  const monthlyText = latestMonth
    ? previousMonth
      ? `${latestMonth.count} leads en ${latestMonth.month}, ${latestMonth.count - previousMonth.count >= 0 ? '+' : ''}${latestMonth.count - previousMonth.count} vs mes anterior`
      : `${latestMonth.count} leads en ${latestMonth.month}`
    : 'Sin historial mensual';

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Leads
      </h1>
      <p className="text-sm text-slate-400 mb-6 max-w-2xl">
        Calidad de contactos capturados en Shopify: datos disponibles, leads contactables y oportunidades de seguimiento.
      </p>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card title="Leads totales" value={sortedCustomers.length} detail="Clientes o contactos registrados" />
        <Card title="Contactables" value={contactable.length} detail="Con email o telefono" />
        <Card title="Con email" value={withEmail.length} detail="Listos para campanas o seguimiento" />
        <Card title="Con telefono" value={withPhone.length} detail="Listos para contacto directo" />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card title="Incompletos" value={incomplete.length} detail="Falta nombre, email, telefono o pais" />
        <Card title="Ultimo mes activo" value={latestMonth?.month || 'Sin datos'} detail={monthlyText} />
        <Card title="Pais principal" value={countryRows[0]?.country || 'Sin datos'} detail={countryRows[0] ? `${countryRows[0].count} leads` : 'Sin pais registrado'} />
        <Card title="Tasa contactable" value={`${sortedCustomers.length ? Math.round((contactable.length / sortedCustomers.length) * 100) : 0}%`} detail="Porcentaje con al menos un dato de contacto" />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-6">
        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Leads por mes
          </h2>
          {leadsByMonth.length === 0 ? (
            <div className="text-sm text-slate-500">
              No hay historial mensual de leads.
            </div>
          ) : (
            <div className="space-y-3">
              {leadsByMonth.slice(-6).map((row) => (
                <div key={row.month} className="flex items-center justify-between border-b border-slate-800 pb-2 text-sm">
                  <span className="text-slate-100">{row.month}</span>
                  <span className="text-slate-400">{row.count} leads</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Origen por pais
          </h2>
          {countryRows.length === 0 ? (
            <div className="text-sm text-slate-500">
              No hay paises registrados.
            </div>
          ) : (
            <div className="space-y-3">
              {countryRows.map((row) => (
                <div key={row.country} className="flex items-center justify-between border-b border-slate-800 pb-2 text-sm">
                  <span className="text-slate-100">{row.country}</span>
                  <span className="text-slate-400">{row.count} leads</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {sortedCustomers.length === 0 ? (
        <div className="text-sm text-slate-500">
          No se encontraron leads aun.
        </div>
      ) : (
        <section>
          <div className="mb-2">
            <h2 className="text-sm font-semibold text-slate-100">
              Contactos recientes
            </h2>
            <p className="text-xs text-slate-500">
              Los leads incompletos son prioridad para limpieza o enriquecimiento de datos.
            </p>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-slate-900 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-300">Nombre</th>
                  <th className="px-4 py-2 text-left text-slate-300">Email</th>
                  <th className="px-4 py-2 text-left text-slate-300">Telefono</th>
                  <th className="px-4 py-2 text-left text-slate-300">Pais</th>
                  <th className="px-4 py-2 text-left text-slate-300">Calidad</th>
                  <th className="px-4 py-2 text-left text-slate-300">Creado</th>
                </tr>
              </thead>
              <tbody>
                {sortedCustomers.map((customer) => {
                  const issues = getLeadIssues(customer);
                  return (
                    <tr key={customer.id} className="border-b border-slate-900/60">
                      <td className="px-4 py-2 text-slate-100">{getCustomerName(customer)}</td>
                      <td className="px-4 py-2 text-slate-300">{customer.email || '-'}</td>
                      <td className="px-4 py-2 text-slate-400">{customer.phone || customer.default_address?.phone || '-'}</td>
                      <td className="px-4 py-2 text-slate-400">{customer.default_address?.country || 'Sin pais'}</td>
                      <td className="px-4 py-2 text-slate-400">{issues.length ? issues.join(', ') : 'Contactable'}</td>
                      <td className="px-4 py-2 text-slate-500 text-xs">{new Date(customer.created_at).toLocaleString('es-MX')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
