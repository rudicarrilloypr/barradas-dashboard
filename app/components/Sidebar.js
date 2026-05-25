"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/overview", label: "Resumen" },
  { href: "/sales", label: "Ventas" },
  { href: "/products", label: "Catalogo" },
  { href: "/leads", label: "Leads" },
  { href: "/insights", label: "Inteligencia" },
  { href: "/assistant", label: "Asistente" },
  { href: "/settings", label: "Conexion" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3 md:w-60 md:border-b-0 md:border-r md:px-5 md:py-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="shrink-0">
            <Image
              src="/icon.png"
              alt="Barradas Nexus Icon"
              width={28}
              height={28}
              className="rounded-md"
            />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold tracking-wide md:text-sm">
              Barradas Nexus
            </span>
            <span className="text-[10px] text-slate-500">
              Control comercial digital de barradas.mx
            </span>
          </div>
        </div>
        <span className="text-[10px] uppercase text-slate-500 md:text-xs">
          Beta
        </span>
      </div>

      <nav className="mt-1 flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          const base =
            "rounded-md border px-3 py-2 text-sm whitespace-nowrap transition-colors";
          const active =
            "border-blue-500 bg-blue-600 text-slate-50 shadow-sm shadow-blue-900/40";
          const inactive =
            "border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-600 hover:bg-slate-900";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${base} ${isActive ? active : inactive}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
