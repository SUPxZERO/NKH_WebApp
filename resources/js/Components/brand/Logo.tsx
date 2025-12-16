/**
 * 🎨 NKH Restaurant - Brand Logo Component
 * 
 * A versatile logo component with multiple variants for different use cases:
 * - Header/Navigation
 * - Footer
 * - Auth pages (centered, large)
 * - Loading states (animated)
 * - Watermarks
 * - Hero sections
 */

import React from 'react';
import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { cn } from '@/app/utils/cn';

// Logo size presets
type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
type LogoVariant = 'default' | 'glow' | 'pulse' | 'watermark' | 'loading' | 'minimal';

interface LogoProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    size?: LogoSize;
    variant?: LogoVariant;
    showText?: boolean;
    textPosition?: 'right' | 'bottom';
    className?: string;
    imageClassName?: string;
    onClick?: () => void;
}

// Size configurations
const sizeConfig: Record<LogoSize, { container: string; image: string; text: string; subtext: string }> = {
    xs: {
        container: 'w-8 h-8',
        image: 'w-8 h-8',
        text: 'text-sm font-bold',
        subtext: 'text-[10px]'
    },
    sm: {
        container: 'w-10 h-10',
        image: 'w-10 h-10',
        text: 'text-base font-bold',
        subtext: 'text-xs'
    },
    md: {
        container: 'w-12 h-12',
        image: 'w-12 h-12',
        text: 'text-lg font-bold',
        subtext: 'text-xs'
    },
    lg: {
        container: 'w-16 h-16',
        image: 'w-16 h-16',
        text: 'text-xl font-bold',
        subtext: 'text-sm'
    },
    xl: {
        container: 'w-20 h-20',
        image: 'w-20 h-20',
        text: 'text-2xl font-bold',
        subtext: 'text-sm'
    },
    '2xl': {
        container: 'w-24 h-24',
        image: 'w-24 h-24',
        text: 'text-3xl font-extrabold',
        subtext: 'text-base'
    },
    hero: {
        container: 'w-32 h-32',
        image: 'w-32 h-32',
        text: 'text-4xl font-extrabold',
        subtext: 'text-lg'
    },
};

// Animation variants
const logoVariants: Record<LogoVariant, Variants> = {
    default: {
        initial: { scale: 1 },
        hover: { scale: 1.05, transition: { duration: 0.2 } },
        tap: { scale: 0.98 },
    },
    glow: {
        initial: {
            filter: 'drop-shadow(0 0 0px rgba(217, 70, 239, 0))'
        },
        animate: {
            filter: [
                'drop-shadow(0 0 10px rgba(217, 70, 239, 0.3))',
                'drop-shadow(0 0 25px rgba(217, 70, 239, 0.6))',
                'drop-shadow(0 0 10px rgba(217, 70, 239, 0.3))',
            ],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
            }
        },
        hover: {
            filter: 'drop-shadow(0 0 30px rgba(217, 70, 239, 0.8))',
            scale: 1.05,
        },
    },
    pulse: {
        initial: { scale: 1 },
        animate: {
            scale: [1, 1.05, 1],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
            }
        },
    },
    watermark: {
        initial: { opacity: 0.1 },
        hover: { opacity: 0.2 },
    },
    loading: {
        initial: {
            scale: 1,
            rotate: 0,
            filter: 'drop-shadow(0 0 10px rgba(217, 70, 239, 0.3))'
        },
        animate: {
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
            filter: [
                'drop-shadow(0 0 10px rgba(217, 70, 239, 0.3))',
                'drop-shadow(0 0 30px rgba(217, 70, 239, 0.7))',
                'drop-shadow(0 0 10px rgba(217, 70, 239, 0.3))',
            ],
            transition: {
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
            }
        },
    },
    minimal: {
        initial: { opacity: 1 },
        hover: { opacity: 0.8 },
    },
};

// Glow ring animation for special effects
const glowRingVariants: Variants = {
    initial: { scale: 1, opacity: 0 },
    animate: {
        scale: [1, 1.5, 2],
        opacity: [0.5, 0.2, 0],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
        },
    },
};

export function Logo({
    size = 'md',
    variant = 'default',
    showText = false,
    textPosition = 'right',
    className,
    imageClassName,
    onClick,
    ...props
}: LogoProps) {
    const config = sizeConfig[size];
    const animationVariant = logoVariants[variant];
    const isAnimated = variant === 'glow' || variant === 'pulse' || variant === 'loading';
    const isClickable = !!onClick;

    const containerClasses = cn(
        'relative inline-flex items-center',
        textPosition === 'bottom' ? 'flex-col' : 'flex-row',
        textPosition === 'right' && showText && 'gap-3',
        textPosition === 'bottom' && showText && 'gap-2',
        isClickable && 'cursor-pointer',
        className
    );

    const imageContainerClasses = cn(
        'relative flex-shrink-0',
        config.container,
        variant === 'watermark' && 'opacity-10',
    );

    return (
        <motion.div
            className={containerClasses}
            onClick={onClick}
            initial="initial"
            animate={isAnimated ? 'animate' : 'initial'}
            whileHover={isClickable ? 'hover' : undefined}
            whileTap={isClickable ? 'tap' : undefined}
            {...props}
        >
            {/* Logo Image Container */}
            <motion.div
                className={imageContainerClasses}
                variants={animationVariant}
            >
                {/* Glow Ring Effect (for loading variant) */}
                {variant === 'loading' && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500"
                        variants={glowRingVariants}
                        initial="initial"
                        animate="animate"
                    />
                )}

                {/* Background Glow (for glow variant) */}
                {variant === 'glow' && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 blur-xl" />
                )}

                {/* Logo Image */}
                <motion.img
                    src="/Nkhlogo.png"
                    alt="NKH Restaurant Logo"
                    className={cn(
                        'relative z-10 object-contain',
                        config.image,
                        imageClassName
                    )}
                    loading="eager"
                    draggable={false}
                />
            </motion.div>

            {/* Logo Text */}
            {showText && (
                <div className={cn(
                    'flex flex-col',
                    textPosition === 'bottom' && 'text-center',
                )}>
                    <span className={cn(
                        config.text,
                        'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-fuchsia-600 bg-clip-text text-transparent'
                    )}>
                        NKH
                    </span>
                    <span className={cn(
                        config.subtext,
                        'text-muted-foreground font-medium tracking-wider uppercase'
                    )}>
                        Restaurant
                    </span>
                </div>
            )}
        </motion.div>
    );
}

// ============================================
// SPECIALIZED LOGO VARIANTS
// ============================================

/**
 * Header/Navigation Logo
 */
export function HeaderLogo({ className, onClick }: { className?: string; onClick?: () => void }) {
    return (
        <Logo
            size="sm"
            variant="default"
            showText
            textPosition="right"
            className={className}
            onClick={onClick}
        />
    );
}

/**
 * Footer Logo
 */
export function FooterLogo({ className }: { className?: string }) {
    return (
        <Logo
            size="md"
            variant="default"
            showText
            textPosition="bottom"
            className={className}
        />
    );
}

/**
 * Auth Pages Centered Logo
 */
export function AuthLogo({ className }: { className?: string }) {
    return (
        <motion.div
            className={cn('flex flex-col items-center', className)}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
            <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute -inset-4 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 rounded-full blur-2xl" />

                {/* Logo with glow effect */}
                <Logo
                    size="2xl"
                    variant="glow"
                    showText={false}
                    className="relative"
                />
            </div>

            {/* Brand name with gradient */}
            <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-fuchsia-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
                    NKH Restaurant
                </h1>
                <p className="mt-1 text-sm text-muted-foreground tracking-widest uppercase">
                    Culinary Excellence
                </p>
            </motion.div>
        </motion.div>
    );
}

/**
 * Loading State Logo
 */
export function LoadingLogo({
    className,
    message = 'Loading...'
}: {
    className?: string;
    message?: string;
}) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
            <Logo
                size="lg"
                variant="loading"
                showText={false}
            />
            <motion.p
                className="text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                {message}
            </motion.p>
        </div>
    );
}

/**
 * Watermark Logo (for backgrounds)
 */
export function WatermarkLogo({
    className,
    position = 'center'
}: {
    className?: string;
    position?: 'center' | 'top-right' | 'bottom-right' | 'bottom-left';
}) {
    const positionClasses = {
        center: 'inset-0 flex items-center justify-center',
        'top-right': 'top-8 right-8',
        'bottom-right': 'bottom-8 right-8',
        'bottom-left': 'bottom-8 left-8',
    };

    return (
        <div className={cn('absolute pointer-events-none', positionClasses[position], className)}>
            <Logo
                size="hero"
                variant="watermark"
                showText={false}
                className="opacity-5"
                imageClassName="grayscale"
            />
        </div>
    );
}

/**
 * Hero Section Decorative Logo
 */
export function HeroLogo({ className }: { className?: string }) {
    return (
        <motion.div
            className={cn('relative', className)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            {/* Decorative rings */}
            <motion.div
                className="absolute inset-0 rounded-full border-2 border-fuchsia-500/20"
                style={{ transform: 'scale(1.5)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
                className="absolute inset-0 rounded-full border border-pink-500/10"
                style={{ transform: 'scale(2)' }}
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            />

            {/* Main logo */}
            <Logo
                size="hero"
                variant="glow"
                showText={false}
            />
        </motion.div>
    );
}

/**
 * Favicon/Icon Logo (smallest)
 */
export function IconLogo({ className }: { className?: string }) {
    return (
        <Logo
            size="xs"
            variant="minimal"
            showText={false}
            className={className}
        />
    );
}

export default Logo;
