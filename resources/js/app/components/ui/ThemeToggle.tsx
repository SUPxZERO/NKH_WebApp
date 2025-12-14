import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useThemeStore, ThemeMode } from '@/app/store/theme';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'button' | 'switch';
  showLabel?: boolean;
}

export function ThemeToggle({ className, variant = 'default', showLabel = false }: ThemeToggleProps) {
  const { isDark, mode, toggle: toggleTheme, setTheme } = useThemeStore();

  // Minimal - just an icon button
  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'hover:bg-secondary',
          'text-muted-foreground hover:text-foreground',
          className
        )}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    );
  }

  // Button style with optional label
  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary-hover',
          'border border-border',
          className
        )}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        {showLabel && (
          <span className="text-sm font-medium">{isDark ? 'Light' : 'Dark'}</span>
        )}
      </button>
    );
  }

  // Switch style - slide toggle
  if (variant === 'switch') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'group flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full',
          'hover:bg-secondary',
          className
        )}
      >
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
            'bg-secondary',
            'group-hover:bg-secondary-hover'
          )}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-warning" />
          ) : (
            <Moon className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        {showLabel && (
          <span className="font-medium text-foreground">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        )}
        <div
          className={cn(
            'ml-auto w-11 h-6 rounded-full transition-colors relative',
            isDark ? 'bg-primary' : 'bg-secondary'
          )}
        >
          <motion.div
            className="absolute top-1 w-4 h-4 rounded-full bg-primary-foreground shadow-sm"
            animate={{ left: isDark ? 24 : 4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </div>
      </button>
    );
  }

  // Default - 3-way toggle (Light / Dark / System)
  const themes: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
    { mode: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
    { mode: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
  ];

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center bg-secondary rounded-xl p-1 border border-border">
        {themes.map((theme) => (
          <button
            key={theme.mode}
            onClick={() => setTheme(theme.mode)}
            className={cn(
              'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              mode === theme.mode
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={`Set theme to ${theme.label}`}
            aria-pressed={mode === theme.mode}
          >
            {mode === theme.mode && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 bg-primary rounded-lg"
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

export default ThemeToggle;
