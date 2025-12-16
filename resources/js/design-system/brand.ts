/**
 * 🎨 NKH Restaurant - Brand Design System
 * Logo-Integrated Design Guidelines & CSS Variables
 * 
 * BRAND ANALYSIS:
 * - Shape Language: Spiral/swirl motif (freshness, motion, creativity)
 * - Primary Colors: Fuchsia-Pink-Purple gradient spectrum
 * - Emotional Tone: Premium, modern, creative, food-forward
 * 
 * This file defines the complete brand identity system derived from the logo.
 */

// ============================================
// BRAND COLOR PALETTE (Derived from Logo)
// ============================================
export const brandColors = {
    // Primary Brand Gradient (Logo Colors)
    primary: {
        50: '#fdf4ff',    // Lightest pink tint
        100: '#fae8ff',   // Light pink
        200: '#f5d0fe',   // Soft pink
        300: '#f0abfc',   // Medium pink
        400: '#e879f9',   // Bright fuchsia
        500: '#d946ef',   // Primary fuchsia (logo primary)
        600: '#c026d3',   // Deep fuchsia
        700: '#a21caf',   // Dark magenta
        800: '#86198f',   // Deeper magenta
        900: '#701a75',   // Darkest magenta
        950: '#4a044e',   // Near-black magenta
    },

    // Secondary Gradient (Logo Accent)
    secondary: {
        50: '#fdf2f8',    // Lightest rose
        100: '#fce7f3',   // Light rose
        200: '#fbcfe8',   // Soft rose
        300: '#f9a8d4',   // Medium rose
        400: '#f472b6',   // Bright pink
        500: '#ec4899',   // Primary pink (logo secondary)
        600: '#db2777',   // Deep pink
        700: '#be185d',   // Dark rose
        800: '#9d174d',   // Deeper rose
        900: '#831843',   // Darkest rose
        950: '#500724',   // Near-black rose
    },

    // Tertiary/Accent (Purple tones from logo)
    tertiary: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',   // Primary purple
        600: '#9333ea',
        700: '#7e22ce',
        800: '#6b21a8',
        900: '#581c87',
        950: '#3b0764',
    }
} as const;

// ============================================
// BRAND GRADIENTS (Logo-Inspired)
// ============================================
export const brandGradients = {
    // Primary logo gradient
    primary: 'linear-gradient(135deg, #d946ef 0%, #ec4899 50%, #f472b6 100%)',
    primaryReverse: 'linear-gradient(315deg, #d946ef 0%, #ec4899 50%, #f472b6 100%)',

    // Vibrant logo gradient
    vibrant: 'linear-gradient(135deg, #c026d3 0%, #d946ef 25%, #ec4899 50%, #f472b6 75%, #f9a8d4 100%)',

    // Subtle brand gradient (for backgrounds)
    subtle: 'linear-gradient(135deg, rgba(217, 70, 239, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
    subtleDark: 'linear-gradient(135deg, rgba(217, 70, 239, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',

    // Hero section gradient
    hero: 'linear-gradient(135deg, rgba(217, 70, 239, 0.3) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(162, 28, 175, 0.1) 100%)',
    heroDark: 'linear-gradient(135deg, rgba(217, 70, 239, 0.4) 0%, rgba(236, 72, 153, 0.3) 50%, rgba(162, 28, 175, 0.2) 100%)',

    // Glass overlay gradient
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(217, 70, 239, 0.05) 100%)',
    glassDark: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(217, 70, 239, 0.1) 100%)',

    // Radial glow (for spotlight effects)
    radialGlow: 'radial-gradient(ellipse at center, rgba(217, 70, 239, 0.3) 0%, transparent 70%)',
    radialGlowSubtle: 'radial-gradient(ellipse at center, rgba(217, 70, 239, 0.15) 0%, transparent 50%)',

    // Text gradient
    text: 'linear-gradient(90deg, #d946ef 0%, #ec4899 50%, #f472b6 100%)',
    textVibrant: 'linear-gradient(90deg, #c026d3 0%, #d946ef 30%, #ec4899 60%, #f472b6 100%)',

    // Mesh gradient (modern effect)
    mesh: `
    radial-gradient(at 40% 20%, rgba(217, 70, 239, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(236, 72, 153, 0.2) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(162, 28, 175, 0.2) 0px, transparent 50%),
    radial-gradient(at 80% 50%, rgba(168, 85, 247, 0.1) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(217, 70, 239, 0.2) 0px, transparent 50%)
  `,
} as const;

// ============================================
// BRAND SHADOWS (Logo-Colored Glows)
// ============================================
export const brandShadows = {
    // Subtle glow
    glowSm: '0 0 15px rgba(217, 70, 239, 0.2)',
    glowMd: '0 0 30px rgba(217, 70, 239, 0.3)',
    glowLg: '0 0 50px rgba(217, 70, 239, 0.4)',
    glowXl: '0 0 80px rgba(217, 70, 239, 0.5)',

    // Button shadows
    buttonPrimary: '0 4px 20px rgba(217, 70, 239, 0.35)',
    buttonPrimaryHover: '0 8px 30px rgba(217, 70, 239, 0.5)',

    // Card shadows with brand tint
    cardBrand: '0 4px 30px rgba(217, 70, 239, 0.1)',
    cardBrandHover: '0 8px 40px rgba(217, 70, 239, 0.2)',

    // Premium elevated effect
    elevated: `
    0 0 0 1px rgba(217, 70, 239, 0.1),
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 0 40px rgba(217, 70, 239, 0.1)
  `,
    elevatedHover: `
    0 0 0 1px rgba(217, 70, 239, 0.2),
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 0 60px rgba(217, 70, 239, 0.2)
  `,
} as const;

// ============================================
// LOGO USAGE GUIDELINES
// ============================================
export const logoUsage = {
    // Logo source paths
    paths: {
        primary: '/Nkhlogo.png',
        // Add SVG version when available
        // svg: '/logo.svg',
    },

    // Minimum sizes
    minSize: {
        header: { width: 40, height: 40 },    // Navbar/header usage
        footer: { width: 48, height: 48 },    // Footer usage
        auth: { width: 80, height: 80 },      // Auth page centered logo
        hero: { width: 120, height: 120 },    // Hero section large usage
        favicon: { width: 32, height: 32 },   // Browser favicon
        loading: { width: 64, height: 64 },   // Loading state
    },

    // Clear space (percentage of logo size)
    clearSpace: 0.25,  // 25% clear space around logo

    // Do's and Don'ts
    guidelines: {
        dos: [
            'Use on dark backgrounds for maximum impact',
            'Use gradient version as primary',
            'Maintain aspect ratio at all times',
            'Use as watermark with 10-20% opacity',
            'Animate with subtle pulse or glow effects',
        ],
        donts: [
            'Never stretch or distort the logo',
            'Never place on busy/cluttered backgrounds',
            'Never use low contrast color combinations',
            'Never rotate more than 15 degrees for decorative use',
            'Never add effects that obscure the logo shape',
        ],
    },
} as const;

// ============================================
// BRAND TYPOGRAPHY
// ============================================
export const brandTypography = {
    // Font families that complement the logo
    fontFamily: {
        display: '"Playfair Display", Georgia, serif',    // Elegant headings
        heading: '"Inter", system-ui, sans-serif',        // Modern headings
        body: '"Inter", system-ui, sans-serif',           // Clean body text
        accent: '"Dancing Script", cursive',              // Decorative accents
        mono: '"JetBrains Mono", monospace',              // Code/technical
    },

    // Letter spacing for brand feel
    letterSpacing: {
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
    },
} as const;

// ============================================
// BRAND ANIMATIONS
// ============================================
export const brandAnimations = {
    // Logo-specific animations
    logoGlow: {
        keyframes: `
      @keyframes logoGlow {
        0%, 100% { filter: drop-shadow(0 0 10px rgba(217, 70, 239, 0.3)); }
        50% { filter: drop-shadow(0 0 25px rgba(217, 70, 239, 0.6)); }
      }
    `,
        animation: 'logoGlow 3s ease-in-out infinite',
    },

    logoPulse: {
        keyframes: `
      @keyframes logoPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `,
        animation: 'logoPulse 2s ease-in-out infinite',
    },

    logoSpin: {
        keyframes: `
      @keyframes logoSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `,
        animation: 'logoSpin 20s linear infinite',
    },

    // Gradient animations
    gradientShift: {
        keyframes: `
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `,
        animation: 'gradientShift 8s ease infinite',
    },

    // Shimmer effect
    shimmer: {
        keyframes: `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `,
        animation: 'shimmer 2s infinite',
    },
} as const;

// ============================================
// BRAND BORDER RADIUS (Logo-Inspired Curves)
// ============================================
export const brandRadius = {
    // Organic curves inspired by logo spiral
    sm: '0.5rem',     // 8px - Subtle rounding
    md: '0.75rem',    // 12px - Standard elements
    lg: '1rem',       // 16px - Cards, modals
    xl: '1.5rem',     // 24px - Large cards, sections
    '2xl': '2rem',    // 32px - Hero elements
    '3xl': '3rem',    // 48px - Feature sections
    full: '9999px',   // Circular elements

    // Special brand shapes
    pill: '9999px',   // Pill-shaped buttons
    blob: '60% 40% 30% 70% / 60% 30% 70% 40%',  // Organic blob shape
} as const;

// ============================================
// CSS CUSTOM PROPERTIES GENERATOR
// ============================================
export const generateBrandCSS = (): string => {
    return `
    :root {
      /* Brand Primary Colors */
      --brand-primary-50: ${brandColors.primary[50]};
      --brand-primary-100: ${brandColors.primary[100]};
      --brand-primary-200: ${brandColors.primary[200]};
      --brand-primary-300: ${brandColors.primary[300]};
      --brand-primary-400: ${brandColors.primary[400]};
      --brand-primary-500: ${brandColors.primary[500]};
      --brand-primary-600: ${brandColors.primary[600]};
      --brand-primary-700: ${brandColors.primary[700]};
      --brand-primary-800: ${brandColors.primary[800]};
      --brand-primary-900: ${brandColors.primary[900]};
      
      /* Brand Gradients */
      --brand-gradient-primary: ${brandGradients.primary};
      --brand-gradient-vibrant: ${brandGradients.vibrant};
      --brand-gradient-subtle: ${brandGradients.subtle};
      --brand-gradient-hero: ${brandGradients.hero};
      --brand-gradient-text: ${brandGradients.text};
      
      /* Brand Shadows */
      --brand-glow-sm: ${brandShadows.glowSm};
      --brand-glow-md: ${brandShadows.glowMd};
      --brand-glow-lg: ${brandShadows.glowLg};
      --brand-shadow-button: ${brandShadows.buttonPrimary};
      --brand-shadow-card: ${brandShadows.cardBrand};
      
      /* Brand Animation */
      ${brandAnimations.logoGlow.keyframes}
      ${brandAnimations.logoPulse.keyframes}
      ${brandAnimations.gradientShift.keyframes}
      ${brandAnimations.shimmer.keyframes}
    }
    
    .dark {
      --brand-gradient-subtle: ${brandGradients.subtleDark};
      --brand-gradient-hero: ${brandGradients.heroDark};
    }
  `;
};

// ============================================
// UTILITY CLASSES GENERATOR
// ============================================
export const brandUtilityClasses = `
  /* Brand text gradient */
  .text-brand-gradient {
    background: ${brandGradients.text};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  /* Brand background gradient */
  .bg-brand-gradient {
    background: ${brandGradients.primary};
  }
  
  .bg-brand-subtle {
    background: ${brandGradients.subtle};
  }
  
  .bg-brand-mesh {
    background: ${brandGradients.mesh};
  }
  
  /* Brand glow effects */
  .glow-brand-sm {
    box-shadow: ${brandShadows.glowSm};
  }
  
  .glow-brand-md {
    box-shadow: ${brandShadows.glowMd};
  }
  
  .glow-brand-lg {
    box-shadow: ${brandShadows.glowLg};
  }
  
  /* Logo animations */
  .animate-logo-glow {
    animation: ${brandAnimations.logoGlow.animation};
  }
  
  .animate-logo-pulse {
    animation: ${brandAnimations.logoPulse.animation};
  }
  
  .animate-gradient-shift {
    background-size: 200% 200%;
    animation: ${brandAnimations.gradientShift.animation};
  }
  
  /* Brand borders */
  .border-brand {
    border-color: ${brandColors.primary[500]};
  }
  
  .border-brand-subtle {
    border-color: rgba(217, 70, 239, 0.2);
  }
  
  /* Brand ring/focus */
  .ring-brand {
    --tw-ring-color: rgba(217, 70, 239, 0.5);
  }
`;

export type BrandColors = typeof brandColors;
export type BrandGradients = typeof brandGradients;
