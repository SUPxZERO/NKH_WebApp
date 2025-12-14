import React from 'react';
import { cn } from '@/app/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  variant?: 'default' | 'flat' | 'elevated' | 'glass' | 'gradient' | 'glow';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  accent?: 'none' | 'primary' | 'success' | 'warning' | 'destructive' | 'info';
}

const cardVariants = {
  default: 'bg-card border border-border shadow-theme-md',
  flat: 'bg-card border border-border',
  elevated: 'bg-card border border-border shadow-theme-xl',
  glass: 'backdrop-blur-xl bg-card/80 border border-white/10 dark:border-white/5',
  gradient: 'bg-gradient-to-br from-card via-card to-primary/5 border border-border shadow-theme-md',
  glow: 'bg-card border border-primary/20 shadow-lg shadow-primary/10',
};

const accentStyles = {
  none: '',
  primary: 'border-l-4 border-l-primary',
  success: 'border-l-4 border-l-emerald-500',
  warning: 'border-l-4 border-l-amber-500',
  destructive: 'border-l-4 border-l-red-500',
  info: 'border-l-4 border-l-blue-500',
};

export function Card({
  className,
  hover = true,
  variant = 'default',
  padding,
  accent = 'none',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl text-card-foreground overflow-hidden',
        cardVariants[variant],
        accentStyles[accent],
        hover && 'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-theme-lg hover:border-primary/30',
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
  actions?: React.ReactNode;
}

export function CardHeader({ className, gradient, actions, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'p-6 border-b border-border',
        gradient && 'bg-gradient-to-r from-primary/5 to-transparent',
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
    <div className={cn('p-6 border-t border-border bg-secondary/30', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export function CardTitle({ className, icon, badge, children, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-bold text-foreground flex items-center gap-2', className)} {...props}>
      {icon && <span className="text-primary">{icon}</span>}
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

// Stat Card for dashboard metrics
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: { value: number; type: 'increase' | 'decrease' };
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  className?: string;
}

const colorStyles = {
  primary: {
    iconBg: 'bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20',
    iconText: 'text-fuchsia-500',
    border: 'border-fuchsia-500/20',
  },
  success: {
    iconBg: 'bg-gradient-to-br from-emerald-500/20 to-green-500/20',
    iconText: 'text-emerald-500',
    border: 'border-emerald-500/20',
  },
  warning: {
    iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20',
    iconText: 'text-amber-500',
    border: 'border-amber-500/20',
  },
  destructive: {
    iconBg: 'bg-gradient-to-br from-red-500/20 to-rose-500/20',
    iconText: 'text-red-500',
    border: 'border-red-500/20',
  },
  info: {
    iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
    iconText: 'text-blue-500',
    border: 'border-blue-500/20',
  },
};

export function StatCard({ title, value, icon, change, color = 'primary', className }: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <Card hover className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-5">
        {/* Background decoration */}
        <div className={cn('absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-50', styles.iconBg)} />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {change && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-sm font-medium',
                change.type === 'increase' ? 'text-emerald-500' : 'text-red-500'
              )}>
                <span>{change.type === 'increase' ? '↑' : '↓'}</span>
                <span>{Math.abs(change.value)}%</span>
                <span className="text-muted-foreground font-normal">vs last period</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center border',
              styles.iconBg,
              styles.border
            )}>
              <div className={styles.iconText}>{icon}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Feature Card for highlighted content
interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  className?: string;
  onClick?: () => void;
}

export function FeatureCard({ title, description, icon, color = 'primary', className, onClick }: FeatureCardProps) {
  const styles = colorStyles[color];

  return (
    <Card
      hover
      className={cn('cursor-pointer group', className)}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className={cn(
          'h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110',
          styles.iconBg,
          'border',
          styles.border
        )}>
          <div className={cn('w-7 h-7', styles.iconText)}>{icon}</div>
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export default Card;
