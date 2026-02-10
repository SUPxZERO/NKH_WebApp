import React from 'react';
import { cn } from '@/app/utils/cn';
import { CheckCircle, Clock, AlertCircle, XCircle, Loader2, Flame, Star, Zap } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  pulse?: boolean;
  children: React.ReactNode;
}

const badgeVariants = {
  default: 'bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30',
  secondary: 'bg-secondary text-secondary-foreground border-border',
  success: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  warning: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  destructive: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  info: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  outline: 'bg-transparent text-foreground border-border hover:bg-secondary/50',
  gradient: 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white border-transparent',
};

const badgeSizes = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1',
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  icon,
  pulse,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border font-semibold transition-all',
        badgeVariants[variant],
        badgeSizes[size],
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

// Status Badge with automatic icon and styling
export type OrderStatus = 'pending' | 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'delivered';

interface StatusBadgeProps {
  status: OrderStatus;
  showIcon?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const getStatusConfig = (t: (key: string) => any): Record<OrderStatus, {
  label: string;
  icon: React.ReactNode;
  classes: string;
}> => ({
  pending: {
    label: t('common.ui.badge.status.pending'),
    icon: <Clock className="w-3 h-3" />,
    classes: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  received: {
    label: t('common.ui.badge.status.received'),
    icon: <CheckCircle className="w-3 h-3" />,
    classes: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  preparing: {
    label: t('common.ui.badge.status.preparing'),
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    classes: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
  },
  ready: {
    label: t('common.ui.badge.status.ready'),
    icon: <Zap className="w-3 h-3" />,
    classes: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  completed: {
    label: t('common.ui.badge.status.completed'),
    icon: <CheckCircle className="w-3 h-3" />,
    classes: 'bg-gradient-to-r from-green-500/20 to-teal-500/20 text-green-600 dark:text-green-400 border-green-500/30',
  },
  delivered: {
    label: t('common.ui.badge.status.delivered'),
    icon: <CheckCircle className="w-3 h-3" />,
    classes: 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30',
  },
  cancelled: {
    label: t('common.ui.badge.status.cancelled'),
    icon: <XCircle className="w-3 h-3" />,
    classes: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  },
});

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
  className,
  children,
}) => {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(t);
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border font-semibold transition-all',
        config.classes,
        badgeSizes[size],
        className
      )}
    >
      {showIcon && <span className="flex-shrink-0">{config.icon}</span>}
      {children || config.label}
    </span>
  );
};

// Special Badges for food items
interface FoodBadgeProps {
  type: 'popular' | 'new' | 'spicy' | 'chef' | 'vegan' | 'discount';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const getFoodBadgeConfig = (t: (key: string) => any): Record<string, { label: string; icon: React.ReactNode; classes: string }> => ({
  popular: {
    label: t('common.ui.badge.food.popular'),
    icon: <Flame className="w-3 h-3" />,
    classes: 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-sm shadow-orange-500/25',
  },
  new: {
    label: t('common.ui.badge.food.new'),
    icon: <Star className="w-3 h-3" />,
    classes: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-transparent shadow-sm shadow-emerald-500/25',
  },
  spicy: {
    label: t('common.ui.badge.food.spicy'),
    icon: <Flame className="w-3 h-3" />,
    classes: 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-transparent shadow-sm shadow-red-500/25',
  },
  chef: {
    label: t('common.ui.badge.food.chef'),
    icon: <Star className="w-3 h-3" />,
    classes: 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white border-transparent shadow-sm shadow-fuchsia-500/25',
  },
  vegan: {
    label: t('common.ui.badge.food.vegan'),
    icon: null,
    classes: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-400 border-green-500/30',
  },
  discount: {
    label: t('common.ui.badge.food.discount'),
    icon: <Zap className="w-3 h-3" />,
    classes: 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black border-transparent shadow-sm shadow-yellow-500/25',
  },
});

export const FoodBadge: React.FC<FoodBadgeProps> = ({ type, size = 'sm', className }) => {
  const { t } = useTranslation();
  const foodBadgeConfig = getFoodBadgeConfig(t);
  const config = foodBadgeConfig[type];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border font-bold transition-all',
        config.classes,
        badgeSizes[size],
        className
      )}
    >
      {config.icon && <span className="flex-shrink-0">{config.icon}</span>}
      {config.label}
    </span>
  );
};

// Notification Badge (for counts)
interface NotificationBadgeProps {
  count: number;
  max?: number;
  color?: 'primary' | 'destructive' | 'success';
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  color = 'destructive',
  className,
}) => {
  const { t } = useTranslation();
  if (count === 0) return null;

  const colors = {
    primary: 'bg-gradient-to-r from-fuchsia-600 to-purple-600',
    destructive: 'bg-gradient-to-r from-red-600 to-rose-600',
    success: 'bg-gradient-to-r from-emerald-600 to-green-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white',
        colors[color],
        'shadow-lg',
        className
      )}
    >
      {count > max ? t('common.ui.badge.notification.overflow', { max: max.toString() }) : count}
    </span>
  );
};

export default Badge;
