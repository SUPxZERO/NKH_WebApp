import { Link, usePage } from '@inertiajs/react';
import { X, User, LogOut, Settings, Search } from 'lucide-react';
import { useState } from 'react';

function SidebarItem({ href, title, icon, onClick }: { href: string; title: string; icon?: React.ReactNode; onClick?: () => void }) {
  const { url } = usePage();
  const isActive = url === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isActive ? 'bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 font-medium' : ''
      }`}
    >
      {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
      <span>{title}</span>
    </Link>
  );
}

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const { auth } = usePage().props as any;
  const user = auth?.user || { name: 'Admin', email: 'admin@example.com' };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-72 sm:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold">NK</span>
            </div>
            <div>
              <span className="font-semibold text-base">NKH POS</span>
              <p className="text-xs text-gray-500">Restaurant System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search - Mobile only in sidebar */}
        <div className="p-4 lg:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-2 space-y-1 px-3">
          <SidebarItem href="/dashboard" title="Dashboard" icon="🏠" onClick={onClose} />
          <SidebarItem href="/pos" title="POS" icon="🧾" onClick={onClose} />
          <SidebarItem href="/menu" title="Menu" icon="🍽️" onClick={onClose} />
          <SidebarItem href="/orders" title="Orders" icon="📦" onClick={onClose} />
          <SidebarItem href="/reservations" title="Reservations" icon="📅" onClick={onClose} />
          <SidebarItem href="/customer/orders" title="Customer Orders" icon="🛒" onClick={onClose} />
          <SidebarItem href="/settings" title="Settings" icon="⚙️" onClick={onClose} />
        </nav>

        {/* User section at bottom - Mobile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {user.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/profile"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
            <button className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
