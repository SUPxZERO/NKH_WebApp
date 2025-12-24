import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { User, LogOut, Settings, ChevronDown, X } from 'lucide-react';
import { usePage } from '@inertiajs/react';

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const { auth } = usePage().props as any;

  const user = auth?.user || { name: 'Admin', email: 'admin@example.com' };

  return (
    <div className="relative">
      {/* User button - always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
          {user.name?.charAt(0) || 'A'}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
      </button>

      {/* Dropdown - Desktop */}
      <div className="hidden sm:block absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p className="font-medium text-sm">{user.name}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
          <User className="w-4 h-4" />
          Profile
        </Link>
        <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <hr className="my-2 border-gray-200 dark:border-gray-700" />
        <button className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Mobile slide-over profile panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 z-50 lg:hidden shadow-xl"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-semibold">Profile</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                {/* User info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {user.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                {/* Profile actions */}
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    <User className="w-5 h-5 text-fuchsia-500" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    <Settings className="w-5 h-5 text-fuchsia-500" />
                    <span>Settings</span>
                  </Link>
                </div>

                {/* Logout */}
                <button className="flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full mt-6">
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Import AnimatePresence and motion from framer-motion
import { motion, AnimatePresence } from 'framer-motion';
