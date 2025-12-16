/**
 * 🎨 NKH Restaurant - Brand Decorative Elements
 * 
 * Logo-inspired decorative components for:
 * - Section dividers
 * - Background patterns
 * - Decorative shapes
 * - Gradient overlays
 * - Spiral/swirl motifs
 */

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/app/utils/cn';
import { brandGradients, brandColors } from '@/design-system/brand';

// ============================================
// SECTION DIVIDERS
// ============================================

interface DividerProps {
    className?: string;
    variant?: 'gradient' | 'dots' | 'wave' | 'spiral';
}

/**
 * Brand-colored section divider with gradient
 */
export function BrandDivider({ className, variant = 'gradient' }: DividerProps) {
    if (variant === 'dots') {
        return (
            <div className={cn('flex items-center justify-center gap-2 py-8', className)}>
                {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500"
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                    />
                ))}
            </div>
        );
    }

    if (variant === 'wave') {
        return (
            <div className={cn('relative h-16 overflow-hidden', className)}>
                <svg
                    className="absolute w-full h-full"
                    preserveAspectRatio="none"
                    viewBox="0 0 1200 60"
                >
                    <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={brandColors.primary[500]} stopOpacity="0.3" />
                            <stop offset="50%" stopColor={brandColors.secondary[500]} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={brandColors.primary[500]} stopOpacity="0.3" />
                        </linearGradient>
                    </defs>
                    <motion.path
                        d="M0,30 Q300,60 600,30 T1200,30 V60 H0 Z"
                        fill="url(#waveGradient)"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: true }}
                    />
                </svg>
            </div>
        );
    }

    if (variant === 'spiral') {
        return (
            <div className={cn('flex items-center justify-center py-8', className)}>
                <motion.div
                    className="w-12 h-12 opacity-30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                    <svg viewBox="0 0 100 100" fill="none">
                        <defs>
                            <linearGradient id="spiralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={brandColors.primary[500]} />
                                <stop offset="100%" stopColor={brandColors.secondary[500]} />
                            </linearGradient>
                        </defs>
                        <path
                            d="M50,10 A40,40 0 1,1 10,50 A35,35 0 1,0 50,15 A30,30 0 1,1 20,50 A25,25 0 1,0 50,25 A20,20 0 1,1 30,50 A15,15 0 1,0 50,35"
                            stroke="url(#spiralGradient)"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </motion.div>
            </div>
        );
    }

    // Default gradient divider
    return (
        <div className={cn('relative py-8', className)}>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />
        </div>
    );
}

// ============================================
// BACKGROUND PATTERNS
// ============================================

interface PatternProps {
    className?: string;
    opacity?: number;
}

/**
 * Dot pattern inspired by logo colors
 */
export function DotPattern({ className, opacity = 0.05 }: PatternProps) {
    return (
        <div
            className={cn('absolute inset-0 pointer-events-none', className)}
            style={{
                backgroundImage: `radial-gradient(circle, ${brandColors.primary[500]}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
            }}
        />
    );
}

/**
 * Grid pattern with brand colors
 */
export function GridPattern({ className, opacity = 0.03 }: PatternProps) {
    return (
        <div
            className={cn('absolute inset-0 pointer-events-none', className)}
            style={{
                backgroundImage: `
          linear-gradient(${brandColors.primary[500]}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 1px, transparent 1px),
          linear-gradient(90deg, ${brandColors.primary[500]}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 1px, transparent 1px)
        `,
                backgroundSize: '64px 64px',
            }}
        />
    );
}

/**
 * Mesh gradient background
 */
export function MeshGradient({ className }: PatternProps) {
    return (
        <div
            className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}
        >
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        </div>
    );
}

// ============================================
// DECORATIVE SHAPES
// ============================================

interface ShapeProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    animate?: boolean;
}

const shapeSizes = {
    sm: 'w-24 h-24',
    md: 'w-48 h-48',
    lg: 'w-72 h-72',
    xl: 'w-96 h-96',
};

/**
 * Decorative blob shape with brand gradient
 */
export function BrandBlob({ className, size = 'md', animate = true }: ShapeProps) {
    const Component = animate ? motion.div : 'div';

    return (
        <Component
            className={cn(
                'absolute bg-gradient-to-br from-fuchsia-500/30 to-pink-500/20 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-3xl pointer-events-none',
                shapeSizes[size],
                className
            )}
            {...(animate ? {
                animate: {
                    borderRadius: [
                        '60% 40% 30% 70% / 60% 30% 70% 40%',
                        '40% 60% 70% 30% / 30% 70% 40% 60%',
                        '60% 40% 30% 70% / 60% 30% 70% 40%',
                    ],
                },
                transition: {
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                },
            } : {})}
        />
    );
}

/**
 * Decorative ring with brand gradient
 */
export function BrandRing({ className, size = 'md', animate = true }: ShapeProps) {
    const Component = animate ? motion.div : 'div';

    return (
        <Component
            className={cn(
                'absolute rounded-full border-2 border-fuchsia-500/20 pointer-events-none',
                shapeSizes[size],
                className
            )}
            {...(animate ? {
                animate: { rotate: 360 },
                transition: {
                    duration: 30,
                    repeat: Infinity,
                    ease: 'linear',
                },
            } : {})}
        />
    );
}

/**
 * Glowing orb decoration
 */
export function GlowOrb({ className, size = 'md', animate = true }: ShapeProps) {
    const Component = animate ? motion.div : 'div';

    return (
        <Component
            className={cn(
                'absolute rounded-full bg-gradient-radial from-fuchsia-500/40 to-transparent blur-2xl pointer-events-none',
                shapeSizes[size],
                className
            )}
            style={{
                background: 'radial-gradient(circle, rgba(217, 70, 239, 0.4) 0%, transparent 70%)',
            }}
            {...(animate ? {
                animate: {
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                },
                transition: {
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                },
            } : {})}
        />
    );
}

// ============================================
// GRADIENT OVERLAYS
// ============================================

interface OverlayProps {
    className?: string;
    direction?: 'top' | 'bottom' | 'left' | 'right' | 'radial';
    intensity?: 'subtle' | 'medium' | 'strong';
}

const intensityOpacity = {
    subtle: { from: '0.1', to: '0.05' },
    medium: { from: '0.2', to: '0.1' },
    strong: { from: '0.3', to: '0.15' },
};

/**
 * Brand gradient overlay
 */
export function BrandOverlay({
    className,
    direction = 'bottom',
    intensity = 'medium'
}: OverlayProps) {
    const opacity = intensityOpacity[intensity];

    const gradientDirection = {
        top: 'to-t',
        bottom: 'to-b',
        left: 'to-l',
        right: 'to-r',
        radial: 'radial',
    };

    if (direction === 'radial') {
        return (
            <div
                className={cn('absolute inset-0 pointer-events-none', className)}
                style={{
                    background: `radial-gradient(ellipse at center, rgba(217, 70, 239, ${opacity.from}) 0%, transparent 70%)`,
                }}
            />
        );
    }

    return (
        <div
            className={cn(
                `absolute inset-0 pointer-events-none bg-gradient-${gradientDirection[direction]}`,
                className
            )}
            style={{
                background: `linear-gradient(${direction === 'top' ? '0deg' : direction === 'bottom' ? '180deg' : direction === 'left' ? '270deg' : '90deg'}, rgba(217, 70, 239, ${opacity.from}) 0%, rgba(236, 72, 153, ${opacity.to}) 50%, transparent 100%)`,
            }}
        />
    );
}

// ============================================
// HERO BACKGROUND COMPONENT
// ============================================

interface HeroBackgroundProps {
    className?: string;
    children?: React.ReactNode;
    variant?: 'default' | 'mesh' | 'particles' | 'minimal';
}

/**
 * Pre-styled hero section background with brand elements
 */
export function HeroBackground({
    className,
    children,
    variant = 'default'
}: HeroBackgroundProps) {
    return (
        <div className={cn('relative overflow-hidden', className)}>
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/10 via-pink-500/5 to-purple-600/10" />

            {variant === 'mesh' && (
                <>
                    <MeshGradient />
                    <GridPattern opacity={0.02} />
                </>
            )}

            {variant === 'default' && (
                <>
                    {/* Decorative blobs */}
                    <BrandBlob className="-top-24 -right-24" size="xl" />
                    <BrandBlob className="-bottom-24 -left-24" size="lg" />

                    {/* Decorative rings */}
                    <BrandRing className="top-1/4 right-1/4" size="md" />

                    {/* Grid pattern */}
                    <GridPattern opacity={0.02} />
                </>
            )}

            {variant === 'particles' && (
                <>
                    <DotPattern opacity={0.03} />
                    <GlowOrb className="top-1/4 left-1/4" size="lg" />
                    <GlowOrb className="bottom-1/4 right-1/4" size="md" />
                </>
            )}

            {/* Border glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}

// ============================================
// CARD GLOW EFFECT
// ============================================

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    children: React.ReactNode;
    glowOnHover?: boolean;
    glowIntensity?: 'subtle' | 'medium' | 'strong';
}

/**
 * Card wrapper with brand glow effect
 */
export function GlowCard({
    className,
    children,
    glowOnHover = true,
    glowIntensity = 'medium',
    ...props
}: GlowCardProps) {
    const glowClasses = {
        subtle: 'opacity-0 group-hover:opacity-20',
        medium: 'opacity-0 group-hover:opacity-30',
        strong: 'opacity-10 group-hover:opacity-50',
    };

    return (
        <div className={cn('relative group rounded-2xl', className)} {...props}>
            {/* Glow effect */}
            <div
                className={cn(
                    'absolute -inset-0.5 rounded-[inherit] bg-gradient-to-r from-fuchsia-500 to-pink-500 blur-md transition-opacity duration-300',
                    glowOnHover ? glowClasses[glowIntensity] : `opacity-${glowIntensity === 'subtle' ? '10' : glowIntensity === 'medium' ? '20' : '30'}`
                )}
            />

            {/* Card content */}
            <div className="relative h-full bg-white dark:bg-gray-800/95 rounded-[inherit] border border-gray-200/80 dark:border-gray-700/80 backdrop-blur-sm">
                {children}
            </div>
        </div>
    );
}

export default {
    BrandDivider,
    DotPattern,
    GridPattern,
    MeshGradient,
    BrandBlob,
    BrandRing,
    GlowOrb,
    BrandOverlay,
    HeroBackground,
    GlowCard,
};
