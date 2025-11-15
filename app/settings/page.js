// src/app/settings/page.js
import {
  SHOP_DOMAIN,
  SHOPIFY_API_VERSION,
  getShopInfo,
} from '../../src/lib/shopify';

export default async function SettingsPage() {
  let status = 'Desconectado';
  let shopName = null;
  let errorMessage = null;

  try {
    const shop = await getShopInfo();
    status = 'Conectado';
    shopName = shop.name;
  } catch (error) {
    status = 'Error de conexión';
    errorMessage = error.message || 'No se pudo conectar a la API de Shopify.';
    console.error('Error en getShopInfo:', error);
  }

  const requiredScopes = [
    'read_products',
    'read_orders',
    'read_customers',
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Settings
      </h1>
      <p className="text-sm text-slate-400 mb-6 max-w-xl">
        Configuración y estado de la conexión entre el dashboard interno y la tienda de Shopify.
      </p>

      {/* Tarjetas de estado */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
            Estado de conexión
          </div>
          <div className="text-lg font-semibold text-slate-50 mb-1">
            {status}
          </div>
          {shopName && (
            <div className="text-xs text-slate-400">
              Tienda: <span className="text-slate-100">{shopName}</span>
            </div>
          )}
          {!shopName && errorMessage && (
            <div className="text-xs text-red-400 mt-1">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
            Dominio de Shopify
          </div>
          <div className="text-sm font-mono text-slate-100 break-all">
            {SHOP_DOMAIN || 'No configurado en .env.local'}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Definido en <span className="font-mono">SHOPIFY_SHOP_DOMAIN</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
            Versión de API
          </div>
          <div className="text-lg font-semibold text-slate-50">
            {SHOPIFY_API_VERSION}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Se puede actualizar desde <span className="font-mono">src/lib/shopify.js</span>
          </div>
        </div>
      </div>

      {/* Scopes requeridos */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-50 mb-2">
          Scopes requeridos (Admin API)
        </h2>
        <p className="text-sm text-slate-400 mb-3">
          La app de Shopify usada por este dashboard debe tener aprobados los siguientes permisos en la Admin API:
        </p>
        <ul className="list-disc list-inside text-sm text-slate-200 mb-2">
          {requiredScopes.map((scope) => (
            <li key={scope}>
              <span className="font-mono">{scope}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500">
          Puedes revisarlos en Shopify:{' '}
          <span className="font-mono">
            Settings &gt; Apps and sales channels &gt; Develop apps &gt; Barradas Dashboard &gt; Configuration
          </span>
        </p>
      </section>

      {/* Notas internas */}
      <section>
        <h2 className="text-lg font-semibold text-slate-50 mb-2">
          Notas internas
        </h2>
        <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
          <li>
            El token de acceso se configura únicamente en{' '}
            <span className="font-mono">.env.local</span> como{' '}
            <span className="font-mono">SHOPIFY_ADMIN_ACCESS_TOKEN</span> y no debe subirse a GitHub.
          </li>
          <li>
            Este dashboard se conecta directamente a la Admin API de Shopify y actualiza los datos en tiempo real (sin cache).
          </li>
          <li>
            Los módulos actuales del dashboard son: Overview, Sales, Products y Leads, todos conectados a la tienda de Barradas.
          </li>
        </ul>
      </section>
    </div>
  );
}
