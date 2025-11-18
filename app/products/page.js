// src/app/products/page.js
import { getProducts } from '../../src/lib/shopify';
import Pagination from '../../app/components/Pagination';

const PAGE_SIZE = 10; // cuántos productos por página

export default async function ProductsPage({ searchParams }) {
  let products = [];

  try {
    products = await getProducts();
  } catch (error) {
    console.error(error);
  }

  const total = products.length;
  const page = parseInt(searchParams?.page || "1", 10);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const pageItems = products.slice(startIndex, endIndex);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Products
      </h1>
      <p className="text-sm text-slate-400 mb-4">
        Lista de productos obtenidos desde Shopify (Admin API) con paginación.
      </p>

      {total === 0 ? (
        <div className="text-sm text-slate-500">
          No se encontraron productos.  
          (Es posible que todavía no haya productos creados en la tienda.)
        </div>
      ) : (
        <>
          <div className="text-xs text-slate-500 mb-2">
            Mostrando{" "}
            <span className="text-slate-100 font-medium">
              {startIndex + 1}–{Math.min(endIndex, total)}
            </span>{" "}
            de{" "}
            <span className="text-slate-100 font-medium">
              {total}
            </span>{" "}
            productos.
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-300">Título</th>
                  <th className="px-4 py-2 text-left text-slate-300">Estado</th>
                  <th className="px-4 py-2 text-left text-slate-300">Tipo</th>
                  <th className="px-4 py-2 text-left text-slate-300">Creado</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="border-b border-slate-900/60">
                    <td className="px-4 py-2 text-slate-100">{p.title}</td>
                    <td className="px-4 py-2 text-slate-400 capitalize">
                      {p.status}
                    </td>
                    <td className="px-4 py-2 text-slate-400">
                      {p.product_type || "-"}
                    </td>
                    <td className="px-4 py-2 text-slate-500 text-xs">
                      {new Date(p.created_at).toLocaleDateString("es-MX")}
                    </td>
                  </tr>
                ))}
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