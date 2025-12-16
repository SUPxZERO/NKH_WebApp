/**
 * 🎨 NKH Restaurant - Brand Components Index
 * 
 * Central export for all brand-related components and utilities.
 * Import from '@/Components/brand' for all brand needs.
 */

// Logo Components
export {
    default as Logo,
    Logo as BrandLogo,
    HeaderLogo,
    FooterLogo,
    AuthLogo,
    LoadingLogo,
    WatermarkLogo,
    HeroLogo,
    IconLogo,
} from './Logo';

// Decorative Elements
export {
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
} from './Decorative';

// Brand Design System
export {
    brandColors,
    brandGradients,
    brandShadows,
    brandAnimations,
    brandRadius,
    brandTypography,
    logoUsage,
    generateBrandCSS,
    brandUtilityClasses,
} from '@/design-system/brand';

// Type exports
export type { BrandColors, BrandGradients } from '@/design-system/brand';
