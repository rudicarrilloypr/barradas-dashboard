// src/app/products/page.js
import { getProducts } from '../../src/lib/shopify';

export default async function ProductsPage() {
  let products = [];

  try {
    products = await getProducts();
  } catch (error) {
    console.error(error);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Products
      </h1>
      <p className="text-sm text-slate-400 mb-4">
        Lista de productos obtenidos desde Shopify (Admin API).
      </p>

      {products.length === 0 ? (
        <div className="text-sm text-slate-500">
          No se encontraron productos.  
          (Es posible que todavía no haya productos creados en la tienda o que haya un problema con la API.)
        </div>
      ) : (
        <div className="mt-4 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="px-4 py-2 text-slate-300">Título</th>
                <th className="px-4 py-2 text-slate-300">Estado</th>
                <th className="px-4 py-2 text-slate-300">Tipo</th>
                <th className="px-4 py-2 text-slate-300">Creado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-900/60">
                  <td className="px-4 py-2 text-slate-100">{p.title}</td>
                  <td className="px-4 py-2 text-slate-400 capitalize">{p.status}</td>
                  <td className="px-4 py-2 text-slate-400">{p.product_type || '-'}</td>
                  <td className="px-4 py-2 text-slate-500 text-xs">
                    {new Date(p.created_at).toLocaleDateString('es-MX')}
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
