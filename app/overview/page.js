function Card({ title, value }) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
        {title}
      </div>
      <div className="text-xl font-semibold text-slate-50">
        {value}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-50 mb-2">
        Overview
      </h1>
      <p className="text-sm text-slate-400 mb-6 max-w-xl">
        Aquí verás el resumen general de ventas, tráfico y desempeño digital de Barradas.
      </p>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Ventas hoy" value="$0" />
        <Card title="Visitas hoy" value="0" />
        <Card title="Leads nuevos" value="0" />
        <Card title="Productos activos" value="0" />
      </div>
    </div>
  );
}
