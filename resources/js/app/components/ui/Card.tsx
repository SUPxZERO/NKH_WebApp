import React from 'react';
import { cn } from '@/app/utils/cn';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  variant?: 'default' | 'flat' | 'elevated' | 'glass' | 'gradient' | 'glow' | 'neon' | 'vibrant';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  accent?: 'none' | 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  glowColor?: 'fuchsia' | 'emerald' | 'amber' | 'blue' | 'red';
}

const cardVariants = {
  default: 'bg-card border border-border shadow-lg',
  flat: 'bg-card border border-border',
  elevated: 'bg-card border border-border shadow-xl',
  glass: 'backdrop-blur-xl bg-card/80 border border-white/10 dark:border-white/5 shadow-lg',
  gradient: 'bg-gradient-to-br from-card via-card to-primary/5 border border-border shadow-lg',
  glow: 'bg-card border border-primary/30 shadow-lg shadow-primary/20',
  neon: 'bg-card/90 backdrop-blur-sm border-2 border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/20',
  vibrant: 'bg-gradient-to-br from-fuchsia-500/10 via-card to-purple-500/10 border border-fuchsia-500/20 shadow-lg shadow-fuchsia-500/10',
};

const accentStyles = {
  none: '',
  primary: 'border-l-4 border-l-fuchsia-500',
  success: 'border-l-4 border-l-emerald-500',
  warning: 'border-l-4 border-l-amber-500',
  destructive: 'border-l-4 border-l-red-500',
  info: 'border-l-4 border-l-blue-500',
};

const glowColors = {
  fuchsia: 'hover:shadow-fuchsia-500/30 hover:border-fuchsia-500/40',
  emerald: 'hover:shadow-emerald-500/30 hover:border-emerald-500/40',
  amber: 'hover:shadow-amber-500/30 hover:border-amber-500/40',
  blue: 'hover:shadow-blue-500/30 hover:border-blue-500/40',
  red: 'hover:shadow-red-500/30 hover:border-red-500/40',
};

export function Card({
  className,
  hover = true,
  variant = 'default',
  padding,
  accent = 'none',
  glowColor = 'fuchsia',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl text-card-foreground overflow-hidden',
        cardVariants[variant],
        accentStyles[accent],
        hover && cn(
          'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl',
          glowColors[glowColor]
        ),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
  gradientColor?: 'fuchsia' | 'emerald' | 'amber' | 'blue' | 'red';
  actions?: React.ReactNode;
}

const headerGradients = {
  fuchsia: 'bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-transparent',
  emerald: 'bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-transparent',
  amber: 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent',
  blue: 'bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-transparent',
  red: 'bg-gradient-to-r from-red-500/10 via-rose-500/5 to-transparent',
};

export function CardHeader({ className, gradient, gradientColor = 'fuchsia', actions, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'p-6 border-b border-border/50',
        gradient && headerGradients[gradientColor],
        actions && 'flex items-center justify-between',
        className
      )}
      {...props}
    >
      {actions ? (
        <>
          <div>{children}</div>
          <div className="flex items-center gap-2">{actions}</div>
        </>
      ) : (
        children
      )}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 border-t border-border/50 bg-gradient-to-r from-secondary/50 to-transparent', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  gradient?: boolean;
}

export function CardTitle({ className, icon, badge, gradient, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-lg font-bold flex items-center gap-2',
        gradient
          ? 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent'
          : 'text-foreground',
        className
      )}
      {...props}
    >
      {icon && <span className="text-fuchsia-500">{icon}</span>}
      {children}
      {badge && <span className="ml-auto">{badge}</span>}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-muted-foreground mt-1', className)} {...props}>
      {children}
    </p>
  );
}

// Stat Card for dashboard metrics - Enhanced with vibrant gradients
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: { value: number; type: 'increase' | 'decrease' };
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  className?: string;
  index?: number;
}

const colorStyles = {
  primary: {
    gradient: 'from-fuchsia-500/20 to-purple-500/10',
    iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
    iconText: 'text-white',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    border: 'border-fuchsia-500/30',
    shadow: 'shadow-fuchsia-500/20',
    glow: 'bg-fuchsia-500',
  },
  success: {
    gradient: 'from-emerald-500/20 to-green-500/10',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
    iconText: 'text-white',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    shadow: 'shadow-emerald-500/20',
    glow: 'bg-emerald-500',
  },
  warning: {
    gradient: 'from-amber-500/20 to-orange-500/10',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    iconText: 'text-white',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    shadow: 'shadow-amber-500/20',
    glow: 'bg-amber-500',
  },
  destructive: {
    gradient: 'from-red-500/20 to-rose-500/10',
    iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
    iconText: 'text-white',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/30',
    shadow: 'shadow-red-500/20',
    glow: 'bg-red-500',
  },
  info: {
    gradient: 'from-blue-500/20 to-cyan-500/10',
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    iconText: 'text-white',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    shadow: 'shadow-blue-500/20',
    glow: 'bg-blue-500',
  },
};

export function StatCard({ title, value, icon, change, color = 'primary', className, index = 0 }: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-sm',
        `bg-gradient-to-br ${styles.gradient}`,
        styles.border,
        `shadow-lg ${styles.shadow}`,
        'hover:-translate-y-1 transition-all duration-300',
        className
      )}
    >
      {/* Decorative glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
        <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
      </div>

      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">{title}</p>
            <p className={cn("text-3xl font-bold", styles.text)}>{value}</p>
            {change && (
              <div className={cn(
                'flex items-center gap-1.5 mt-2 text-sm font-semibold',
                change.type === 'increase' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              )}>
                {change.type === 'increase' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(change.value)}%</span>
                <span className="text-muted-foreground font-normal text-xs">vs last period</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              'p-3 rounded-xl shadow-lg',
              styles.iconBg
            )}>
              <div className={styles.iconText}>{icon}</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Feature Card for highlighted content - Enhanced
interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  className?: string;
  onClick?: () => void;
  index?: number;
}

export function FeatureCard({ title, description, icon, color = 'primary', className, onClick, index = 0 }: FeatureCardProps) {
  const styles = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-sm cursor-pointer group',
        `bg-gradient-to-br ${styles.gradient}`,
        styles.border,
        `shadow-lg ${styles.shadow}`,
        'hover:-translate-y-1 transition-all duration-300',
        className
      )}
    >
      {/* Decorative glow effect */}
      <div className="absolute top-0 right-0 w-40 h-40 transform translate-x-12 -translate-y-12">
        <div className={cn("w-full h-full rounded-full opacity-10 blur-3xl group-hover:opacity-20 transition-opacity", styles.iconBg)} />
      </div>

      <div className="relative p-6">
        <div className={cn(
          'h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg',
          styles.iconBg
        )}>
          <div className={cn('w-7 h-7', styles.iconText)}>{icon}</div>
        </div>
        <h3 className={cn(
          "text-lg font-bold mb-2 transition-colors",
          styles.text
        )}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
        <div className={cn(
          "mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2",
          styles.text
        )}>
          Learn more <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

// Action Card - New component for quick actions
interface ActionCardProps {
  title: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  className?: string;
  onClick?: () => void;
  badge?: string | number;
}

export function ActionCard({ title, icon, color = 'primary', className, onClick, badge }: ActionCardProps) {
  const styles = colorStyles[color];

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-sm w-full text-left',
        `bg-gradient-to-br ${styles.gradient}`,
        styles.border,
        `shadow-lg ${styles.shadow}`,
        'hover:shadow-xl transition-all duration-300 group',
        className
      )}
    >
      <div className="relative p-5 flex items-center gap-4">
        <div className={cn(
          'p-3 rounded-xl shadow-lg transition-transform group-hover:scale-110',
          styles.iconBg
        )}>
          <div className={styles.iconText}>{icon}</div>
        </div>
        <div className="flex-1">
          <h3 className={cn("font-semibold", styles.text)}>{title}</h3>
        </div>
        {badge !== undefined && (
          <div className={cn(
            'px-2.5 py-1 rounded-full text-xs font-bold',
            styles.iconBg,
            styles.iconText
          )}>
            {badge}
          </div>
        )}
        <ArrowUpRight className={cn("w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5", styles.text)} />
      </div>
    </motion.button>
  );
}

// Gradient Card - Fully gradient background
interface GradientCardProps {
  children: React.ReactNode;
  color?: 'fuchsia' | 'emerald' | 'amber' | 'blue' | 'red' | 'purple';
  className?: string;
}

const gradientBgs = {
  fuchsia: 'from-fuchsia-600 to-purple-600',
  emerald: 'from-emerald-600 to-green-600',
  amber: 'from-amber-500 to-orange-600',
  blue: 'from-blue-600 to-cyan-600',
  red: 'from-red-600 to-rose-600',
  purple: 'from-purple-600 to-indigo-600',
};

export function GradientCard({ children, color = 'fuchsia', className }: GradientCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'rounded-2xl p-6 text-white shadow-xl overflow-hidden relative',
        `bg-gradient-to-br ${gradientBgs[color]}`,
        className
      )}
    >
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full transform -translate-x-1/2 translate-y-1/2" />
      </div>
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export default Card;
