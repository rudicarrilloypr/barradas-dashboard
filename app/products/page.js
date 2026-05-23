// src/app/products/page.js
import { getProducts } from '../../src/lib/shopify';
import Pagination from '../../app/components/Pagination';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;
const LOW_STOCK_THRESHOLD = 3;

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

function getProductPrice(product) {
  const prices = (product.variants || [])
    .map((variant) => parseFloat(variant.price || 0))
    .filter((price) => !isNaN(price) && price > 0);

  if (prices.length === 0) return 0;
  return Math.min(...prices);
}

function getInventoryTotal(product) {
  return (product.variants || []).reduce((sum, variant) => {
    const quantity = Number(variant.inventory_quantity || 0);
    return sum + (isNaN(quantity) ? 0 : quantity);
  }, 0);
}

function hasImage(product) {
  return Boolean(product.image || (product.images || []).length > 0);
}

function getHealthIssues(product) {
  const issues = [];
  const stock = getInventoryTotal(product);

  if (!hasImage(product)) issues.push('Sin imagen');
  if (!product.product_type) issues.push('Sin tipo');
  if (!product.vendor) issues.push('Sin proveedor');
  if (getProductPrice(product) <= 0) issues.push('Sin precio');
  if (stock <= 0) issues.push('Sin stock');
  else if (stock <= LOW_STOCK_THRESHOLD) issues.push('Stock bajo');
  if (product.status !== 'active') issues.push('No activo');

  return issues;
}

function buildTypeRows(products) {
  const map = new Map();

  for (const product of products) {
    const type = product.product_type || 'Sin tipo';
    map.set(type, (map.get(type) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function getStatusCounts(products) {
  return products.reduce(
    (counts, product) => {
      counts[product.status] = (counts[product.status] || 0) + 1;
      return counts;
    },
    { active: 0, draft: 0, archived: 0 }
  );
}

export default async function ProductsPage({ searchParams }) {
  const sp = await searchParams;
  const pageParam = (sp?.get ? sp.get('page') : sp?.page) || '1';
  let products = [];

  try {
    products = await getProducts();
  } catch (error) {
    console.error(error);
  }

  const sortedProducts = [...products].sort((a, b) =>
    (a.title || '').localeCompare(b.title || '')
  );
  const total = sortedProducts.length;
  const statusCounts = getStatusCounts(sortedProducts);
  const productsWithIssues = sortedProducts.filter(
    (product) => getHealthIssues(product).length > 0
  );
  const missingImages = sortedProducts.filter((product) => !hasImage(product));
  const missingType = sortedProducts.filter((product) => !product.product_type);
  const lowStockProducts = sortedProducts.filter((product) => {
    const stock = getInventoryTotal(product);
    return product.status === 'active' && stock > 0 && stock <= LOW_STOCK_THRESHOLD;
  });
  const outOfStockProducts = sortedProducts.filter(
    (product) => product.status === 'active' && getInventoryTotal(product) <= 0
  );
  const typeRows = buildTypeRows(sortedProducts);

  const page = parseInt(pageParam, 10);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(page || 1, 1), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pageItems = sortedProducts.slice(startIndex, endIndex);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Productos
      </h1>
      <p className="text-sm text-slate-400 mb-6 max-w-2xl">
        Salud del catalogo conectado a Shopify: estado, datos faltantes, inventario y categorias comerciales.
      </p>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card title="Productos activos" value={statusCounts.active || 0} detail={`${total} productos totales`} />
        <Card title="Borradores" value={statusCounts.draft || 0} detail="Pendientes de publicacion" />
        <Card title="Archivados" value={statusCounts.archived || 0} detail="Fuera de venta activa" />
        <Card title="Con alertas" value={productsWithIssues.length} detail="Imagen, tipo, precio, stock o estado" />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card title="Sin imagen" value={missingImages.length} detail="Impacta conversion y confianza" />
        <Card title="Sin tipo" value={missingType.length} detail="Dificulta filtros y reportes" />
        <Card title="Stock bajo" value={lowStockProducts.length} detail={`Activos con ${LOW_STOCK_THRESHOLD} unidades o menos`} />
        <Card title="Sin stock" value={outOfStockProducts.length} detail="Activos sin inventario disponible" />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-6">
        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Categorias mas cargadas
          </h2>
          {typeRows.length === 0 ? (
            <div className="text-sm text-slate-500">
              No hay categorias para mostrar.
            </div>
          ) : (
            <div className="space-y-3">
              {typeRows.map((row) => (
                <div key={row.type} className="flex items-center justify-between border-b border-slate-800 pb-2 text-sm">
                  <span className="text-slate-100">{row.type}</span>
                  <span className="text-slate-400">{row.count} productos</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Prioridad comercial
          </h2>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              1. Completar imagenes y tipos de producto para mejorar navegacion y confianza.
            </p>
            <p>
              2. Revisar stock bajo o sin stock antes de invertir trafico en campanas.
            </p>
            <p>
              3. Mantener borradores y archivados fuera del conteo comercial activo.
            </p>
          </div>
        </section>
      </div>

      {total === 0 ? (
        <div className="text-sm text-slate-500">
          No se encontraron productos.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Auditoria de productos
              </h2>
              <p className="text-xs text-slate-500">
                Mostrando <span className="text-slate-100 font-medium">{startIndex + 1}-{Math.min(endIndex, total)}</span> de <span className="text-slate-100 font-medium">{total}</span>
              </p>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-900 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-300">Producto</th>
                  <th className="px-4 py-2 text-left text-slate-300">Estado</th>
                  <th className="px-4 py-2 text-left text-slate-300">Tipo</th>
                  <th className="px-4 py-2 text-left text-slate-300">Stock</th>
                  <th className="px-4 py-2 text-left text-slate-300">Precio desde</th>
                  <th className="px-4 py-2 text-left text-slate-300">Alertas</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((product) => {
                  const issues = getHealthIssues(product);
                  return (
                    <tr key={product.id} className="border-b border-slate-900/60">
                      <td className="px-4 py-2 text-slate-100">{product.title}</td>
                      <td className="px-4 py-2 text-slate-400 capitalize">{product.status || '-'}</td>
                      <td className="px-4 py-2 text-slate-400">{product.product_type || 'Sin tipo'}</td>
                      <td className="px-4 py-2 text-slate-300">{getInventoryTotal(product)}</td>
                      <td className="px-4 py-2 text-slate-200">{formatCurrency(getProductPrice(product))}</td>
                      <td className="px-4 py-2 text-slate-400">
                        {issues.length ? issues.join(', ') : 'OK'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            basePath="/products"
          />
        </>
      )}
    </div>
  );
}
