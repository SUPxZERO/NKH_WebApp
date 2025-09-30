import React from 'react';
import { cn } from '@/app/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const base =
  'inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none';

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 text-white shadow-[0_8px_20px_-6px_rgba(236,72,153,0.5)] hover:brightness-110 active:brightness-90 focus:ring-fuchsia-400',
  secondary:
    'bg-white/10 dark:bg-white/5 text-white border border-white/20 backdrop-blur-md hover:bg-white/20 focus:ring-white/30',
  danger:
    'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-[0_8px_20px_-6px_rgba(239,68,68,0.5)] hover:brightness-110 active:brightness-90 focus:ring-red-400',
  ghost:
    'bg-transparent text-current hover:bg-black/5 dark:hover:bg-white/5 focus:ring-gray-300',
  outline:
    'bg-transparent border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-300',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {leftIcon ? <span className={cn(children ? 'mr-2' : '')}>{leftIcon}</span> : null}
      <span className={cn('inline-flex items-center', loading && 'opacity-70')}>{children}</span>
      {rightIcon ? <span className={cn(children ? 'ml-2' : '')}>{rightIcon}</span> : null}
    </button>
  );
}

export default Button;
