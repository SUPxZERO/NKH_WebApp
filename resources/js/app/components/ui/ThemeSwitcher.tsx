import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, ThemeMode } from '@/app/store/theme';
import { motion } from 'framer-motion';
import { cn } from '@/app/utils/cn';

interface ThemeSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeSwitcher({ className, size = 'md' }: ThemeSwitcherProps) {
  const { mode, setTheme } = useThemeStore();

  const themes: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'light', icon: <Sun className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />, label: 'Light' },
    { mode: 'dark', icon: <Moon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />, label: 'Dark' },
    { mode: 'system', icon: <Monitor className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />, label: 'System' },
  ];

  const sizeClasses = {
    sm: 'p-0.5',
    md: 'p-1',
    lg: 'p-1.5',
  };

  const buttonSizeClasses = {
    sm: 'px-2 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  };

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-center bg-secondary rounded-xl border border-border',
          sizeClasses[size]
        )}
      >
        {themes.map((theme) => (
          <button
            key={theme.mode}
            onClick={() => setTheme(theme.mode)}
            className={cn(
              'relative flex items-center gap-1.5 rounded-lg font-medium transition-all duration-200',
              buttonSizeClasses[size],
              mode === theme.mode
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={`Set theme to ${theme.label}`}
            aria-pressed={mode === theme.mode}
          >
            {mode === theme.mode && (
              <motion.div
                layoutId="theme-switcher-indicator"
                className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
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
