import Link from 'next/link';

const menuItems = [
  { href: '/overview', label: 'Overview' },
  { href: '/sales', label: 'Sales' },
  { href: '/products', label: 'Products' },
  { href: '/leads', label: 'Leads' },
  { href: '/settings', label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-slate-950 border-r border-slate-800 text-slate-50 p-4 flex flex-col gap-4">
      <div className="mb-2 font-bold text-lg tracking-wide">
        Barradas Dashboard
      </div>
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-amber-400 hover:text-slate-900 transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
