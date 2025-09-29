/**
 * 🍽️ RestaurantButton - Revolutionary Button Component
 * Appetite-inducing buttons with restaurant-focused design
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { componentAnimations } from '@/design-system/animations';

export type ButtonVariant = 
  | 'primary'      // Golden gradient - main actions
  | 'secondary'    // Warm outline - secondary actions  
  | 'ghost'        // Transparent - subtle actions
  | 'destructive'  // Red gradient - dangerous actions
  | 'success'      // Green gradient - positive actions
  | 'premium'      // Gold foil effect - premium features
  | 'chef'         // Chef's special styling
  | 'customer'     // Customer-friendly styling
  | 'admin'        // Admin power-user styling
  | 'appetizer'    // Food category styling
  | 'main'         // Main course styling
  | 'dessert'      // Dessert styling
  | 'beverage';    // Beverage styling

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';

interface RestaurantButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  appetiteMode?: boolean; // Enhanced appetite-inducing effects
  soundEffect?: boolean;  // Sound feedback on click
  haptic?: boolean;      // Haptic feedback
  glow?: boolean;        // Appetite glow effect
}

// 🎨 Base Button Styles
const baseStyles = [
  'inline-flex items-center justify-center font-medium transition-all duration-300',
  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400',
  'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
  'relative overflow-hidden',
  'select-none touch-manipulation', // Better mobile experience
].join(' ');

// 📏 Size Variants
const sizeVariants: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-xs rounded-lg gap-1',
  sm: 'h-9 px-4 text-sm rounded-xl gap-2',
  md: 'h-11 px-6 text-sm rounded-xl gap-2',
  lg: 'h-12 px-8 text-base rounded-2xl gap-3',
  xl: 'h-14 px-10 text-lg rounded-2xl gap-3',
  hero: 'h-16 px-12 text-xl rounded-3xl gap-4',
};

// 🎨 Style Variants - Restaurant Focused
const styleVariants: Record<ButtonVariant, string> = {
  // Core Actions
  primary: [
    'bg-gradient-to-r from-primary-500 to-primary-600',
    'hover:from-primary-600 hover:to-primary-700',
    'text-white shadow-lg shadow-primary-500/25',
    'hover:shadow-xl hover:shadow-primary-500/30',
    'active:scale-98',
  ].join(' '),

  secondary: [
    'bg-white/80 dark:bg-neutral-800/80',
    'border-2 border-primary-200 dark:border-primary-700',
    'text-primary-700 dark:text-primary-300',
    'hover:bg-primary-50 dark:hover:bg-primary-900/20',
    'hover:border-primary-300 dark:hover:border-primary-600',
    'backdrop-blur-sm',
  ].join(' '),

  ghost: [
    'text-neutral-700 dark:text-neutral-300',
    'hover:bg-primary-50 dark:hover:bg-primary-900/20',
    'hover:text-primary-700 dark:hover:text-primary-300',
  ].join(' '),

  destructive: [
    'bg-gradient-to-r from-red-500 to-red-600',
    'hover:from-red-600 hover:to-red-700',
    'text-white shadow-lg shadow-red-500/25',
    'hover:shadow-xl hover:shadow-red-500/30',
  ].join(' '),

  success: [
    'bg-gradient-to-r from-emerald-500 to-emerald-600',
    'hover:from-emerald-600 hover:to-emerald-700',
    'text-white shadow-lg shadow-emerald-500/25',
    'hover:shadow-xl hover:shadow-emerald-500/30',
  ].join(' '),

  // Premium Variants
  premium: [
    'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600',
    'hover:from-amber-500 hover:via-yellow-600 hover:to-amber-700',
    'text-amber-900 font-semibold shadow-xl shadow-amber-500/30',
    'hover:shadow-2xl hover:shadow-amber-500/40',
    'border border-amber-300/50',
    'relative before:absolute before:inset-0',
    'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
    'before:translate-x-[-100%] hover:before:translate-x-[100%]',
    'before:transition-transform before:duration-700',
  ].join(' '),

  // Role-Based Variants
  chef: [
    'bg-gradient-to-r from-secondary-600 to-secondary-700',
    'hover:from-secondary-700 hover:to-secondary-800',
    'text-white shadow-lg shadow-secondary-600/25',
    'border border-secondary-500/30',
  ].join(' '),

  customer: [
    'bg-gradient-to-r from-blue-500 to-blue-600',
    'hover:from-blue-600 hover:to-blue-700',
    'text-white shadow-lg shadow-blue-500/25',
    'hover:shadow-xl hover:shadow-blue-500/30',
  ].join(' '),

  admin: [
    'bg-gradient-to-r from-purple-600 to-purple-700',
    'hover:from-purple-700 hover:to-purple-800',
    'text-white shadow-lg shadow-purple-600/25',
    'border border-purple-500/30',
  ].join(' '),

  // Food Category Variants
  appetizer: [
    'bg-gradient-to-r from-food-appetizer to-yellow-500',
    'hover:from-yellow-500 hover:to-yellow-600',
    'text-yellow-900 shadow-lg shadow-yellow-500/25',
  ].join(' '),

  main: [
    'bg-gradient-to-r from-food-main to-red-600',
    'hover:from-red-600 hover:to-red-700',
    'text-white shadow-lg shadow-red-500/25',
  ].join(' '),

  dessert: [
    'bg-gradient-to-r from-food-dessert to-pink-600',
    'hover:from-pink-600 hover:to-pink-700',
    'text-white shadow-lg shadow-pink-500/25',
  ].join(' '),

  beverage: [
    'bg-gradient-to-r from-food-beverage to-blue-600',
    'hover:from-blue-600 hover:to-blue-700',
    'text-white shadow-lg shadow-blue-500/25',
  ].join(' '),
};

// 🎭 Animation Variants
const buttonAnimations = {
  default: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 }
  },
  appetite: {
    whileHover: { 
      scale: 1.05,
      boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)',
      filter: 'saturate(1.2) brightness(1.05)'
    },
    whileTap: { scale: 0.95 }
  },
  premium: {
    whileHover: { 
      scale: 1.03,
      boxShadow: '0 25px 50px rgba(245, 158, 11, 0.4)',
      y: -2
    },
    whileTap: { scale: 0.97 }
  }
};

export const RestaurantButton = React.forwardRef<HTMLButtonElement, RestaurantButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    appetiteMode = false,
    soundEffect = false,
    haptic = false,
    glow = false,
    children,
    onClick,
    disabled,
    ...props
  }, ref) => {
    
    // 🎵 Sound Effect Handler
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      
      // Haptic feedback for mobile
      if (haptic && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      // Sound effect
      if (soundEffect) {
        // You can implement sound effects here
        // const audio = new Audio('/sounds/button-click.mp3');
        // audio.play().catch(() => {}); // Ignore errors
      }
      
      onClick?.(e);
    };

    // 🎭 Choose animation variant
    const animationVariant = appetiteMode 
      ? buttonAnimations.appetite 
      : variant === 'premium' 
        ? buttonAnimations.premium 
        : buttonAnimations.default;

    // 🎨 Combine styles
    const buttonStyles = cn(
      baseStyles,
      sizeVariants[size],
      styleVariants[variant],
      glow && 'animate-appetite-glow',
      className
    );

    return (
      <motion.button
        ref={ref}
        className={buttonStyles}
        onClick={handleClick}
        disabled={disabled || loading}
        {...animationVariant}
        {...props}
      >
        {/* 🌟 Shimmer Effect for Premium Buttons */}
        {variant === 'premium' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
        )}

        {/* 🔄 Loading Spinner */}
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}

        {/* 👈 Left Icon */}
        {leftIcon && !loading && (
          <span className="flex-shrink-0">
            {leftIcon}
          </span>
        )}

        {/* 📝 Button Content */}
        {children && (
          <span className={cn(
            'flex-1 truncate',
            loading && 'opacity-70'
          )}>
            {children as React.ReactNode}
          </span>
        )}

        {/* 👉 Right Icon */}
        {rightIcon && !loading && (
          <span className="flex-shrink-0">
            {rightIcon}
          </span>
        )}

        {/* ✨ Appetite Glow Effect */}
        {appetiteMode && (
          <motion.div
            className="absolute inset-0 rounded-inherit bg-gradient-to-r from-primary-400/20 to-primary-600/20"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.button>
    );
  }
);

RestaurantButton.displayName = 'RestaurantButton';

// 🎯 Convenience Components
export const PrimaryButton = (props: Omit<RestaurantButtonProps, 'variant'>) => (
  <RestaurantButton variant="primary" {...props} />
);

export const SecondaryButton = (props: Omit<RestaurantButtonProps, 'variant'>) => (
  <RestaurantButton variant="secondary" {...props} />
);

export const ChefButton = (props: Omit<RestaurantButtonProps, 'variant'>) => (
  <RestaurantButton variant="chef" appetiteMode {...props} />
);

export const CustomerButton = (props: Omit<RestaurantButtonProps, 'variant'>) => (
  <RestaurantButton variant="customer" {...props} />
);

export const PremiumButton = (props: Omit<RestaurantButtonProps, 'variant'>) => (
  <RestaurantButton variant="premium" glow {...props} />
);

export const OrderButton = (props: Omit<RestaurantButtonProps, 'variant'>) => (
  <RestaurantButton variant="primary" appetiteMode haptic soundEffect {...props} />
);

export default RestaurantButton;
