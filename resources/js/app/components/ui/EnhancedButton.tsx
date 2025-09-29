import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/app/utils/cn';

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gradient' | 'neon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  pulse?: boolean;
  glow?: boolean;
  haptic?: boolean;
  soundEffect?: 'click' | 'success' | 'error';
}

const buttonVariants = {
  primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25',
  secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md',
  danger: 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-lg shadow-rose-500/25',
  ghost: 'hover:bg-white/10 text-gray-300 hover:text-white',
  gradient: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-orange-500 hover:from-fuchsia-700 hover:via-pink-700 hover:to-orange-600 text-white shadow-lg shadow-fuchsia-500/25',
  neon: 'bg-black border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 shadow-lg shadow-cyan-400/50 hover:shadow-cyan-400/75'
};

const sizeVariants = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg'
};

export function EnhancedButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  pulse = false,
  glow = false,
  haptic = false,
  soundEffect,
  className,
  children,
  onClick,
  disabled,
  ...props
}: EnhancedButtonProps) {
  
  const playSound = (effect: string) => {
    if (typeof window !== 'undefined' && 'Audio' in window) {
      try {
        const audio = new Audio(`/sounds/${effect}.mp3`);
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (e) {}
    }
  };

  const triggerHaptic = () => {
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (soundEffect) playSound(soundEffect);
    if (haptic) triggerHaptic();
    onClick?.(e);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      animate={pulse ? { 
        boxShadow: [
          '0 0 0 0 rgba(168, 85, 247, 0.4)',
          '0 0 0 10px rgba(168, 85, 247, 0)',
          '0 0 0 0 rgba(168, 85, 247, 0)'
        ]
      } : {}}
      transition={{ 
        duration: pulse ? 2 : 0.2,
        repeat: pulse ? Infinity : 0
      }}
      className={cn(
        'relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden',
        buttonVariants[variant],
        sizeVariants[size],
        glow && 'animate-pulse',
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {/* Animated background for gradient buttons */}
      {(variant === 'gradient' || variant === 'neon') && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
      )}
      
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      
      {!loading && leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      
      <span className="relative z-10">{children}</span>
      
      {!loading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </motion.button>
  );
}

export default EnhancedButton;
