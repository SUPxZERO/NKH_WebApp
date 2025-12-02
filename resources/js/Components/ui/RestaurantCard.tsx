/**
 * 🏛️ RestaurantCard - Enhanced Card Component
 * Restaurant-focused card variants with hospitality warmth
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/app/utils/cn';
import { animationVariants } from '@/design-system/animations';

export type CardVariant = 
  | 'default'      // Standard card
  | 'menu-item'    // Food item presentation
  | 'recipe'       // Recipe card with ingredients
  | 'order'        // Order summary card
  | 'customer'     // Customer profile card
  | 'analytics'    // Dashboard analytics card
  | 'premium'      // VIP/premium styling
  | 'floating'     // Elevated floating card
  | 'glass'        // Glassmorphism effect
  | 'warm'         // Warm hospitality feel
  | 'elegant';     // Fine dining elegance

export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

interface RestaurantCardProps extends Omit<HTMLMotionProps<'div'>, 'size'> {
  variant?: CardVariant;
  size?: CardSize;
  hover?: boolean;
  glow?: boolean;
  appetiteMode?: boolean;
  children: React.ReactNode;
}

// 📏 Size Variants
const sizeVariants: Record<CardSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

// 🎨 Style Variants
const styleVariants: Record<CardVariant, string> = {
  default: [
    'bg-white/90 dark:bg-neutral-800/90',
    'border border-neutral-200 dark:border-neutral-700',
    'backdrop-blur-sm',
  ].join(' '),

  'menu-item': [
    'bg-gradient-to-br from-white/95 to-primary-50/80',
    'dark:from-neutral-800/95 dark:to-primary-900/20',
    'border border-primary-100 dark:border-primary-800/30',
    'backdrop-blur-xl',
  ].join(' '),

  recipe: [
    'bg-gradient-to-br from-secondary-50/90 to-white/95',
    'dark:from-secondary-900/30 dark:to-neutral-800/95',
    'border border-secondary-200 dark:border-secondary-700/30',
    'backdrop-blur-xl',
  ].join(' '),

  order: [
    'bg-gradient-to-br from-blue-50/90 to-white/95',
    'dark:from-blue-900/20 dark:to-neutral-800/95',
    'border border-blue-200 dark:border-blue-700/30',
    'backdrop-blur-xl',
  ].join(' '),

  customer: [
    'bg-gradient-to-br from-emerald-50/90 to-white/95',
    'dark:from-emerald-900/20 dark:to-neutral-800/95',
    'border border-emerald-200 dark:border-emerald-700/30',
    'backdrop-blur-xl',
  ].join(' '),

  analytics: [
    'bg-gradient-to-br from-purple-50/90 to-white/95',
    'dark:from-purple-900/20 dark:to-neutral-800/95',
    'border border-purple-200 dark:border-purple-700/30',
    'backdrop-blur-xl',
  ].join(' '),

  premium: [
    'bg-gradient-to-br from-amber-50/95 to-yellow-50/90',
    'dark:from-amber-900/30 dark:to-yellow-900/20',
    'border-2 border-amber-200 dark:border-amber-700/50',
    'backdrop-blur-xl',
    'shadow-premium',
    'relative overflow-hidden',
    'before:absolute before:inset-0',
    'before:bg-gradient-to-br before:from-amber-400/10 before:to-transparent',
    'before:pointer-events-none',
  ].join(' '),

  floating: [
    'bg-white/95 dark:bg-neutral-800/95',
    'border-0',
    'backdrop-blur-xl',
    'shadow-strong',
  ].join(' '),

  glass: [
    'glass-food',
  ].join(' '),

  warm: [
    'bg-gradient-to-br from-primary-50/95 to-orange-50/90',
    'dark:from-primary-900/30 dark:to-orange-900/20',
    'border border-primary-200 dark:border-primary-700/30',
    'backdrop-blur-xl',
  ].join(' '),

  elegant: [
    'bg-gradient-to-br from-neutral-50/98 to-primary-50/95',
    'dark:from-neutral-900/95 dark:to-primary-900/30',
    'border border-neutral-300 dark:border-neutral-600/30',
    'backdrop-blur-xl',
    'shadow-soft',
  ].join(' '),
};

// 🎭 Animation Variants
const cardAnimations = {
  default: {
    whileHover: { y: -2 }
  },
  floating: {
    whileHover: { 
      y: -8,
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
    }
  },
  premium: {
    whileHover: { 
      y: -4,
      scale: 1.02,
      boxShadow: '0 30px 60px rgba(245, 158, 11, 0.3)'
    }
  },
  appetite: {
    whileHover: { 
      scale: 1.02,
      boxShadow: '0 20px 40px rgba(245, 158, 11, 0.2)'
    }
  }
};

export function RestaurantCard({
  variant = 'default',
  size = 'md',
  hover = true,
  glow = false,
  appetiteMode = false,
  className,
  children,
  ...props
}: RestaurantCardProps) {
  
  // 🎭 Choose animation variant
  const animationVariant = appetiteMode 
    ? cardAnimations.appetite
    : variant === 'premium' 
      ? cardAnimations.premium
      : variant === 'floating'
        ? cardAnimations.floating
        : cardAnimations.default;

  // 🎨 Combine styles
  const cardStyles = cn(
    'rounded-3xl transition-all duration-300',
    sizeVariants[size],
    styleVariants[variant],
    hover && 'cursor-pointer',
    glow && 'animate-appetite-glow',
    className
  );

  return (
    <motion.div
      className={cardStyles}
      variants={animationVariants.fadeIn}
      initial="initial"
      animate="animate"
      {...(hover ? animationVariant : {})}
      {...props}
    >
      {/* ✨ Premium Shimmer Effect */}
      {variant === 'premium' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}

      {children}
    </motion.div>
  );
}

// 🎯 Card Sub-components
export function CardHeader({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        'border-b border-neutral-200/50 dark:border-neutral-700/50 pb-4 mb-4',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        'border-t border-neutral-200/50 dark:border-neutral-700/50 pt-4 mt-4',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 
      className={cn(
        'font-display text-xl font-semibold text-neutral-900 dark:text-neutral-100',
        className
      )} 
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p 
      className={cn(
        'text-sm text-neutral-600 dark:text-neutral-400 mt-1',
        className
      )} 
      {...props}
    >
      {children}
    </p>
  );
}

// 🎯 Convenience Components
export const MenuCard = (props: Omit<RestaurantCardProps, 'variant'>) => (
  <RestaurantCard variant="menu-item" appetiteMode {...props} />
);

export const OrderCard = (props: Omit<RestaurantCardProps, 'variant'>) => (
  <RestaurantCard variant="order" {...props} />
);

export const CustomerCard = (props: Omit<RestaurantCardProps, 'variant'>) => (
  <RestaurantCard variant="customer" {...props} />
);

export const AnalyticsCard = (props: Omit<RestaurantCardProps, 'variant'>) => (
  <RestaurantCard variant="analytics" {...props} />
);

export const PremiumCard = (props: Omit<RestaurantCardProps, 'variant'>) => (
  <RestaurantCard variant="premium" glow {...props} />
);

export const FloatingCard = (props: Omit<RestaurantCardProps, 'variant'>) => (
  <RestaurantCard variant="floating" {...props} />
);

export const GlassCard = (props: Omit<RestaurantCardProps, 'variant'>) => (
  <RestaurantCard variant="glass" {...props} />
);

export const WarmCard = (props: Omit<RestaurantCardProps, 'variant'>) => (
  <RestaurantCard variant="warm" appetiteMode {...props} />
);

export const ElegantCard = (props: Omit<RestaurantCardProps, 'variant'>) => (
  <RestaurantCard variant="elegant" {...props} />
);

export default RestaurantCard;
