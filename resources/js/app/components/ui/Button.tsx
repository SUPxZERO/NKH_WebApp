import React from 'react';
import { cn } from '@/app/utils/cn';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'danger'
  | 'ghost'
  | 'outline'
  | 'link'
  | 'success'
  | 'warning'
  | 'info'
  | 'gradient'
  | 'glass'
  | 'neon';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'icon-sm' | 'icon-lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
  glow?: boolean;
  pulse?: boolean;
  rounded?: 'default' | 'full' | 'none';
}

const base =
  'inline-flex items-center justify-center font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]';

const sizes: Record<ButtonSize, string> = {
  xs: 'h-8 px-2.5 text-xs gap-1 min-w-[44px]', // min-w ensures touch target width
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
  xl: 'h-14 px-8 text-lg gap-3',
  icon: 'h-11 w-11 p-0', // 44px for touch target
  'icon-sm': 'h-9 w-9 p-0',
  'icon-lg': 'h-12 w-12 p-0',
};

const roundedStyles = {
  default: 'rounded-xl',
  full: 'rounded-full',
  none: 'rounded-none',
};

const variants: Record<ButtonVariant, string> = {
  // Primary - Vibrant fuchsia/purple gradient with glow
  primary: `
    bg-gradient-to-r from-fuchsia-600 via-purple-600 to-fuchsia-600
    bg-[length:200%_100%]
    text-white font-bold
    shadow-lg shadow-fuchsia-500/30
    border border-fuchsia-500/20
    hover:bg-[position:100%_0]
    hover:shadow-xl hover:shadow-fuchsia-500/40
    hover:-translate-y-0.5
    focus-visible:ring-fuchsia-500
  `,

  // Secondary - Elegant with subtle gradient border
  secondary: `
    bg-secondary text-secondary-foreground
    border border-border
    shadow-sm
    hover:bg-secondary-hover
    hover:border-primary/40
    hover:shadow-md
    hover:-translate-y-0.5
    focus-visible:ring-primary
  `,

  // Destructive - Intense red gradient
  destructive: `
    bg-gradient-to-r from-red-600 via-rose-600 to-red-600
    bg-[length:200%_100%]
    text-white font-bold
    shadow-lg shadow-red-500/30
    border border-red-500/20
    hover:bg-[position:100%_0]
    hover:shadow-xl hover:shadow-red-500/40
    hover:-translate-y-0.5
    focus-visible:ring-red-500
  `,

  // Danger - Alias for destructive
  danger: `
    bg-gradient-to-r from-red-600 via-rose-600 to-red-600
    bg-[length:200%_100%]
    text-white font-bold
    shadow-lg shadow-red-500/30
    border border-red-500/20
    hover:bg-[position:100%_0]
    hover:shadow-xl hover:shadow-red-500/40
    hover:-translate-y-0.5
    focus-visible:ring-red-500
  `,

  // Ghost - Minimal with hover effect
  ghost: `
    bg-transparent text-foreground
    hover:bg-secondary/80
    hover:text-foreground
    focus-visible:ring-primary
  `,

  // Outline - Vibrant border with fill on hover
  outline: `
    bg-transparent
    border-2 border-primary/60 text-primary
    hover:bg-primary hover:text-white
    hover:border-primary
    hover:shadow-lg hover:shadow-primary/25
    hover:-translate-y-0.5
    focus-visible:ring-primary
  `,

  // Link - Text only with underline
  link: `
    bg-transparent text-primary
    underline-offset-4 hover:underline
    p-0 h-auto font-medium
    hover:text-primary/80
    focus-visible:ring-primary
  `,

  // Success - Vibrant emerald/green gradient
  success: `
    bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600
    bg-[length:200%_100%]
    text-white font-bold
    shadow-lg shadow-emerald-500/30
    border border-emerald-500/20
    hover:bg-[position:100%_0]
    hover:shadow-xl hover:shadow-emerald-500/40
    hover:-translate-y-0.5
    focus-visible:ring-emerald-500
  `,

  // Warning - Vibrant amber/orange gradient
  warning: `
    bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500
    bg-[length:200%_100%]
    text-white font-bold
    shadow-lg shadow-amber-500/30
    border border-amber-500/20
    hover:bg-[position:100%_0]
    hover:shadow-xl hover:shadow-amber-500/40
    hover:-translate-y-0.5
    focus-visible:ring-amber-500
  `,

  // Info - Vibrant blue/cyan gradient
  info: `
    bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600
    bg-[length:200%_100%]
    text-white font-bold
    shadow-lg shadow-blue-500/30
    border border-blue-500/20
    hover:bg-[position:100%_0]
    hover:shadow-xl hover:shadow-blue-500/40
    hover:-translate-y-0.5
    focus-visible:ring-blue-500
  `,

  // Gradient - Multi-color rainbow effect
  gradient: `
    bg-gradient-to-r from-fuchsia-600 via-purple-600 via-blue-600 to-cyan-600
    bg-[length:300%_100%]
    text-white font-bold
    shadow-lg shadow-purple-500/30
    border border-purple-500/20
    animate-gradient-shift
    hover:shadow-xl hover:shadow-purple-500/40
    hover:-translate-y-0.5
    focus-visible:ring-purple-500
  `,

  // Glass - Frosted glass effect
  glass: `
    backdrop-blur-xl bg-white/10 dark:bg-white/5
    text-foreground font-medium
    border border-white/20 dark:border-white/10
    shadow-lg shadow-black/5
    hover:bg-white/20 dark:hover:bg-white/10
    hover:border-white/30 dark:hover:border-white/20
    hover:-translate-y-0.5
    focus-visible:ring-white/50
  `,

  // Neon - Glowing neon effect
  neon: `
    bg-transparent
    text-fuchsia-500
    border-2 border-fuchsia-500
    shadow-[0_0_10px_rgba(217,70,239,0.5),inset_0_0_10px_rgba(217,70,239,0.1)]
    hover:bg-fuchsia-500/10
    hover:shadow-[0_0_20px_rgba(217,70,239,0.7),inset_0_0_20px_rgba(217,70,239,0.2)]
    hover:-translate-y-0.5
    focus-visible:ring-fuchsia-500
  `,
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading,
  leftIcon,
  rightIcon,
  disabled,
  children,
  glow,
  pulse,
  rounded = 'default',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        base,
        sizes[size],
        roundedStyles[rounded],
        variants[variant],
        glow && 'animate-glow',
        pulse && 'animate-pulse',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      {children && <>{children}</>}
      {rightIcon && !loading ? <span className="flex-shrink-0">{rightIcon}</span> : null}
    </button>
  );
}

// Icon Button variant for compact actions
export function IconButton({
  className,
  variant = 'ghost',
  size = 'icon',
  children,
  ...props
}: Omit<ButtonProps, 'leftIcon' | 'rightIcon'>) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn('p-0', className)}
      {...props}
    >
      {children}
    </Button>
  );
}

// Floating Action Button
interface FABProps extends ButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export function FloatingActionButton({
  className,
  position = 'bottom-right',
  variant = 'primary',
  size = 'icon-lg',
  ...props
}: FABProps) {
  const positionStyles = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2',
  };

  return (
    <Button
      variant={variant}
      size={size}
      rounded="full"
      className={cn(
        positionStyles[position],
        'z-50 shadow-2xl',
        className
      )}
      {...props}
    />
  );
}

// Button Group
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  attached?: boolean;
}

export function ButtonGroup({ children, className, attached = false }: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex',
        attached ? '[&>button]:rounded-none [&>button:first-child]:rounded-l-xl [&>button:last-child]:rounded-r-xl [&>button:not(:first-child)]:-ml-px' : 'gap-2',
        className
      )}
    >
      {children}
    </div>
  );
}

export default Button;
