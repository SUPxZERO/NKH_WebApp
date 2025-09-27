import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, ThemeMode } from '@/app/store/theme';
import { motion } from 'framer-motion';

export function ThemeSwitcher() {
  const { mode, setTheme } = useThemeStore();

  const themes: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
    { mode: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
    { mode: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
  ];

  return (
    <div className="relative">
      <div className="flex items-center bg-white/10 dark:bg-white/5 rounded-xl p-1 backdrop-blur-md border border-white/10">
        {themes.map((theme) => (
          <button
            key={theme.mode}
            onClick={() => setTheme(theme.mode)}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === theme.mode
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {mode === theme.mode && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-pink-500 rounded-lg"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {theme.icon}
              <span className="hidden sm:inline">{theme.label}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ThemeSwitcher;
