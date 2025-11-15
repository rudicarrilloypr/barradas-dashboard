// app/components/Topbar.js
"use client";

export default function Topbar() {
  return (
    <header className="h-12 sm:h-14 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 bg-slate-950/90 backdrop-blur">
      <div className="text-xs sm:text-sm text-slate-400">
        Panel de gestión ·{" "}
        <span className="text-blue-400 font-medium">Barradas Nexus</span>
      </div>
      <div className="text-xs sm:text-sm text-slate-400">
        Usuario:{" "}
        <span className="text-slate-100 font-medium">Rodolfo Carrillo</span>
      </div>
    </header>
  );
}
