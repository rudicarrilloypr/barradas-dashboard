// app/components/Sidebar.js
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoMark from "./LogoMark";

const menuItems = [
  { href: "/overview", label: "Overview" },
  { href: "/sales", label: "Sales" },
  { href: "/products", label: "Products" },
  { href: "/leads", label: "Leads" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const asideClass =
    "w-full md:w-60 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 px-4 py-3 md:px-5 md:py-6 flex flex-col gap-3";

  const navClass =
    "flex md:flex-col gap-2 mt-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0";

  return (
    <aside className={asideClass}>
      {/* Logo + nombre */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LogoMark size={22} />
          <div className="flex flex-col leading-tight">
            <span className="font-semibold tracking-wide text-xs md:text-sm">
              Barradas Nexus
            </span>
            <span className="text-[10px] text-slate-500">
              Control comercial
            </span>
          </div>
        </div>
        <span className="text-[10px] md:text-xs text-slate-500 uppercase">
          Beta
        </span>
      </div>

      <nav className={navClass}>
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          const base =
            "px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors border";
          const active =
            "bg-blue-600 text-slate-50 border-blue-500 shadow-sm shadow-blue-900/40";
          const inactive =
            "bg-slate-950 text-slate-200 border-slate-800 hover:bg-slate-900 hover:border-slate-600";

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
