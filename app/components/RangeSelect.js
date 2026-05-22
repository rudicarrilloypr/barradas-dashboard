// app/components/RangeSelect.js
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const OPTIONS = [
  { value: "30d", label: "Últimos 30 días" },
  { value: "90d", label: "Últimos 90 días" },
  { value: "ytd", label: "Año en curso" },
  { value: "all", label: "Todo el historial" },
];

export default function RangeSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const current = searchParams.get("range") || "30d";

  const handleChange = (e) => {
    const value = e.target.value;

    const params = new URLSearchParams(searchParams.toString());
    if (value === "30d") {
      params.delete("range"); // 30d será el default
    } else {
      params.set("range", value);
    }
    params.delete("page");

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    router.push(url);
  };

  return (
    <div className="mb-4 flex items-center gap-2 text-xs sm:text-sm text-slate-400">
      <span>Rango de análisis:</span>
      <select
        value={current}
        onChange={handleChange}
        className="bg-slate-900 border border-slate-700 text-slate-100 rounded-md px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Helper opcional si quieres reutilizar las etiquetas en el server:
export function getRangeLabel(value) {
  const found = OPTIONS.find((o) => o.value === value);
  return found ? found.label : "Últimos 30 días";
}
