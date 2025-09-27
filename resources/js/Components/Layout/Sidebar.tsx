import { Link, usePage } from '@inertiajs/react';

function SidebarItem({ href, title, icon }: { href: string; title: string; icon?: React.ReactNode }) {
  const { url } = usePage();
  const isActive = url === href;
  return (
    <Link
      href={href}
      className={`flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isActive ? 'bg-gray-100 dark:bg-gray-700 font-medium' : ''
      }`}
    >
      {icon && <span className="mr-3">{icon}</span>}
      <span>{title}</span>
    </Link>
  );
}

export default function Sidebar() {
  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-sm bg-primary" />
          <span className="font-semibold">NKH POS</span>
        </div>
      </div>
      <nav className="mt-6 space-y-1">
        <SidebarItem href="/dashboard" title="Dashboard" icon={<span className="w-4 h-4">🏠</span>} />
        <SidebarItem href="/pos" title="POS" icon={<span className="w-4 h-4">🧾</span>} />
        <SidebarItem href="/menu" title="Menu" icon={<span className="w-4 h-4">🍽️</span>} />
        <SidebarItem href="/orders" title="Orders" icon={<span className="w-4 h-4">📦</span>} />
        <SidebarItem href="/settings" title="Settings" icon={<span className="w-4 h-4">⚙️</span>} />
      </nav>
    </div>
  );
}
