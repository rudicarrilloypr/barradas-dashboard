// components/Layout.js
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Contenedor centrado y con ancho máximo */}
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row">
        {/* Sidebar arriba en mobile, a la izquierda en desktop */}
        <Sidebar />

        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
