import AssistantDemo from '../components/AssistantDemo';
import { getProducts } from '../../src/lib/shopify';

export const dynamic = 'force-dynamic';

function Stat({ title, value, detail }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
        {title}
      </div>
      <div className="text-xl font-semibold text-slate-50">{value}</div>
      {detail && <div className="mt-2 text-xs text-slate-500">{detail}</div>}
    </div>
  );
}

function getProductStats(products) {
  const active = products.filter((product) => product.status === 'active');
  const withImages = active.filter(
    (product) => product.image || product.images?.length > 0
  );
  const withPrices = active.filter((product) =>
    (product.variants || []).some((variant) => Number(variant.price || 0) > 0)
  );

  return {
    total: products.length,
    active: active.length,
    withImages: withImages.length,
    withPrices: withPrices.length,
  };
}

export default async function AssistantPage() {
  let stats = {
    total: 0,
    active: 0,
    withImages: 0,
    withPrices: 0,
  };
  let errorMessage = null;

  try {
    const products = await getProducts();
    stats = getProductStats(products);
  } catch (error) {
    console.error('Error cargando stats del asistente:', error);
    errorMessage =
      error.message || 'No se pudo leer el catalogo de Shopify para la prueba.';
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-semibold text-slate-50">
          Barry, asistente Shopify
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          MVP de asistente guiado para la pagina de Shopify. Barry ya no usa
          conversacion abierta: guia al cliente con opciones multiples y crea
          un ticket para el asesor digital.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Productos leidos" value={stats.total} detail="Desde Shopify Admin API" />
        <Stat title="Activos" value={stats.active} detail="Contexto comercial" />
        <Stat title="Con imagen" value={stats.withImages} detail="Catalogo visual" />
        <Stat title="Con precio" value={stats.withPrices} detail="Datos disponibles" />
      </div>

      <AssistantDemo />
    </div>
  );
}
