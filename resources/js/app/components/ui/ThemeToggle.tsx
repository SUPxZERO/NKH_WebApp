import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useThemeStore } from '@/app/store/theme';

interface ThemeToggleProps {
    className?: string;
    variant?: 'default' | 'minimal' | 'button';
    showLabel?: boolean;
}

export function ThemeToggle({ className, variant = 'default', showLabel = false }: ThemeToggleProps) {
    const { isDark, toggle: toggleTheme } = useThemeStore();

    if (variant === 'minimal') {
        return (
            <button
                onClick={toggleTheme}
                className={cn(
                    'p-2 rounded-lg transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    'text-gray-600 dark:text-gray-400',
                    className
                )}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
        );
    }

    if (variant === 'button') {
        return (
            <button
                onClick={toggleTheme}
                className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
                    'hover:bg-gray-200 dark:hover:bg-gray-700',
                    'border border-gray-200 dark:border-gray-700',
                    className
                )}
            >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {showLabel && <span className="text-sm font-medium">{isDark ? 'Light' : 'Dark'}</span>}
            </button>
        );
    }

    // Default toggle switch
    return (
        <button
            onClick={toggleTheme}
            className={cn(
                'group flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                className
            )}
        >
            <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                'bg-gray-100 dark:bg-gray-800',
                'group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
            )}>
                {isDark ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
            </div>
            {showLabel && (
                <span className="font-medium text-gray-700 dark:text-gray-300">
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                </span>
            )}
            <div className={cn(
                'ml-auto w-11 h-6 rounded-full transition-colors relative',
                isDark ? 'bg-purple-500' : 'bg-gray-200'
            )}>
                <motion.div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                    animate={{ left: isDark ? 24 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </div>
        </button>
    );
}

export default ThemeToggle;
