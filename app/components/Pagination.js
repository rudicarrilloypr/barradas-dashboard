// src/components/Pagination.js
"use client";

import Link from "next/link";

export default function Pagination({ page, totalPages, basePath }) {
  if (totalPages <= 1) return null;

  const current = page ?? 1;

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-slate-300">
      <div>
        Página <span className="font-semibold">{current}</span> de{" "}
        <span className="font-semibold">{totalPages}</span>
      </div>
      <div className="flex gap-2">
        <Link
          href={`${basePath}?page=${current - 1}`}
          className={`px-3 py-1 rounded-md border border-slate-700 hover:bg-slate-800 transition-colors ${
            current <= 1 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          Anterior
        </Link>
        <Link
          href={`${basePath}?page=${current + 1}`}
          className={`px-3 py-1 rounded-md border border-slate-700 hover:bg-slate-800 transition-colors ${
            current >= totalPages ? "pointer-events-none opacity-40" : ""
          }`}
        >
          Siguiente
        </Link>
      </div>
    </div>
  );
}
