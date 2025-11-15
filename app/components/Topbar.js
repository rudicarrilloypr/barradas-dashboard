export default function Topbar() {
  return (
    <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur">
      <div className="text-base font-medium">
        Panel de Gestión Comercial
      </div>
      <div className="text-sm text-slate-400">
        Usuario: <span className="text-slate-100">Rodolfo Carrillo</span>
      </div>
    </header>
  );
}
