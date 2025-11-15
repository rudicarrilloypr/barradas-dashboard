// app/components/LogoMark.js
"use client";

export default function LogoMark({ size = 24 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-900/40"
    >
      <span className="text-[10px] font-bold tracking-[0.15em] text-slate-50">
        BN
      </span>
    </div>
  );
}
