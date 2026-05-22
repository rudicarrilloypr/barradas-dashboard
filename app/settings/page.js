// src/app/settings/page.js
import {
  SHOP_DOMAIN,
  SHOPIFY_API_VERSION,
  SHOPIFY_AUTH_MODE,
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
    status = 'Error de conexion';
    errorMessage = error.message || 'No se pudo conectar a la API de Shopify.';
    console.error('Error en getShopInfo:', error);
  }

  const requiredScopes = [
    'read_products',
    'read_orders',
    'read_customers',
  ];

  const optionalScopes = [
    'read_all_orders',
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Settings
      </h1>
      <p className="text-sm text-slate-400 mb-6 max-w-xl">
        Configuracion y estado de la conexion entre el dashboard interno y la tienda de Shopify.
      </p>

      {/* Tarjetas de estado */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4 mb-8">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
            Estado de conexion
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
            Modo de auth
          </div>
          <div className="text-sm font-semibold text-slate-50">
            {SHOPIFY_AUTH_MODE}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Usa token fijo legacy o Client ID/Secret del Dev Dashboard.
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
            Version de API
          </div>
          <div className="text-lg font-semibold text-slate-50">
            {SHOPIFY_API_VERSION}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Se actualiza desde <span className="font-mono">src/lib/shopify.js</span>
          </div>
        </div>
      </div>

      {/* Scopes requeridos */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-50 mb-2">
          Scopes requeridos (Admin API)
        </h2>
        <p className="text-sm text-slate-400 mb-3">
          La app de Shopify usada por este dashboard debe tener aprobados estos permisos en la Admin API:
        </p>
        <ul className="list-disc list-inside text-sm text-slate-200 mb-2">
          {requiredScopes.map((scope) => (
            <li key={scope}>
              <span className="font-mono">{scope}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-slate-400 mb-2">
          Opcional si quieres historico de ordenes mayor a 60 dias:
        </p>
        <ul className="list-disc list-inside text-sm text-slate-200 mb-2">
          {optionalScopes.map((scope) => (
            <li key={scope}>
              <span className="font-mono">{scope}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Notas internas */}
      <section>
        <h2 className="text-lg font-semibold text-slate-50 mb-2">
          Variables locales
        </h2>
        <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
          <li>
            Para apps nuevas del Shopify Dev Dashboard usa{' '}
            <span className="font-mono">SHOPIFY_CLIENT_ID</span> y{' '}
            <span className="font-mono">SHOPIFY_CLIENT_SECRET</span>.
          </li>
          <li>
            Si algun dia tienes un token legacy, tambien se soporta{' '}
            <span className="font-mono">SHOPIFY_ADMIN_ACCESS_TOKEN</span>.
          </li>
          <li>
            El archivo <span className="font-mono">.env.local</span> no debe subirse a GitHub.
          </li>
          <li>
            Este dashboard se conecta a la Admin API de Shopify y solicita datos sin cache.
          </li>
        </ul>
      </section>
    </div>
  );
}
