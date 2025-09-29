/**
 * 🎨 NKH Restaurant Management System - Design Tokens
 * Revolutionary restaurant-focused design system
 * "Culinary Excellence Meets Digital Innovation"
 */

export const designTokens = {
  // 🌈 Revolutionary Color Palette - Inspired by Fine Dining
  colors: {
    // Primary Brand Colors - Golden Amber Theme
    primary: {
      50: '#fefdf8',    // Cream white (plate background)
      100: '#fef7e6',   // Warm ivory
      200: '#fdecc4',   // Golden butter
      300: '#fbdb8f',   // Saffron
      400: '#f8c555',   // Turmeric
      500: '#f59e0b',   // Golden amber (primary)
      600: '#d97706',   // Burnt orange
      700: '#b45309',   // Caramel
      800: '#92400e',   // Dark caramel
      900: '#78350f',   // Espresso
    },

    // Secondary Colors - Rich Food Tones
    secondary: {
      50: '#f8f4f0',    // Warm white
      100: '#e8ddd4',   // Latte foam
      200: '#d4c4b0',   // Cappuccino
      300: '#b8a082',   // Mocha
      400: '#9c7c54',   // Coffee bean
      500: '#8b5a2b',   // Dark roast (secondary)
      600: '#7a4a1f',   // Espresso bean
      700: '#693c17',   // Dark chocolate
      800: '#582f11',   // Cocoa
      900: '#47240c',   // Dark cocoa
    },

    // Accent Colors - Fresh Ingredients
    accent: {
      green: '#059669',     // Fresh herbs
      red: '#dc2626',       // Tomato red
      purple: '#7c3aed',    // Eggplant
      orange: '#ea580c',    // Carrot orange
      blue: '#0284c7',      // Ocean blue (seafood)
      yellow: '#eab308',    // Lemon zest
      pink: '#ec4899',      // Radish
    },

    // Neutral Palette - Natural Textures
    neutral: {
      50: '#fafaf9',        // Paper white
      100: '#f5f5f4',       // Linen
      200: '#e7e5e4',       // Stone
      300: '#d6d3d1',       // Pebble
      400: '#a8a29e',       // Slate
      500: '#78716c',       // Charcoal
      600: '#57534e',       // Graphite
      700: '#44403c',       // Dark stone
      800: '#292524',       // Black pepper
      900: '#1c1917',       // Midnight
    },

    // Semantic Colors - Restaurant Operations
    semantic: {
      success: '#10b981',   // Fresh green
      warning: '#f59e0b',   // Golden amber
      error: '#ef4444',     // Urgent red
      info: '#3b82f6',      // Cool blue
    },

    // Special Food Colors
    food: {
      appetizer: '#fbbf24', // Golden appetizer
      main: '#dc2626',      // Rich main course
      dessert: '#ec4899',   // Sweet dessert
      beverage: '#3b82f6',  // Refreshing beverage
      special: '#8b5cf6',   // Chef's special
    }
  },

  // 📏 Spacing System - Golden Ratio Based
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
    '5xl': '8rem',    // 128px
  },

  // 🔲 Border Radius - Organic Shapes
  borderRadius: {
    none: '0',
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    full: '9999px',
  },

  // 🌫️ Shadows - Appetite-Inducing Depth
  shadows: {
    soft: '0 2px 8px rgba(0, 0, 0, 0.04)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.08)',
    strong: '0 8px 32px rgba(0, 0, 0, 0.12)',
    glow: '0 0 24px rgba(245, 158, 11, 0.3)',
    food: '0 8px 32px rgba(245, 158, 11, 0.15)',
    appetite: '0 12px 40px rgba(245, 158, 11, 0.2)',
    premium: '0 20px 60px rgba(139, 90, 43, 0.25)',
  },

  // 📝 Typography Scale - Golden Ratio Based
  typography: {
    // Font Families
    fontFamily: {
      display: ['Playfair Display', 'serif'],     // Elegant headings
      body: ['Inter', 'sans-serif'],              // Clean body text
      accent: ['Dancing Script', 'cursive'],      // Handwritten specials
      mono: ['JetBrains Mono', 'monospace'],      // Technical data
    },

    // Font Sizes
    fontSize: {
      xs: '0.75rem',      // 12px - Captions
      sm: '0.875rem',     // 14px - Small text
      base: '1rem',       // 16px - Body
      lg: '1.125rem',     // 18px - Large body
      xl: '1.25rem',      // 20px - Subheadings
      '2xl': '1.5rem',    // 24px - Headings
      '3xl': '1.875rem',  // 30px - Large headings
      '4xl': '2.25rem',   // 36px - Display
      '5xl': '3rem',      // 48px - Hero
      '6xl': '3.75rem',   // 60px - Mega display
    },

    // Font Weights
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    // Line Heights
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // 🎭 Animation Timing
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '800ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      appetite: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
  },

  // 📱 Breakpoints - Mobile-First
  breakpoints: {
    xs: '320px',    // Small phones
    sm: '640px',    // Large phones
    md: '768px',    // Tablets
    lg: '1024px',   // Small laptops
    xl: '1280px',   // Large laptops
    '2xl': '1536px', // Desktop monitors
  },

  // 🎯 Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
} as const;

// 🎨 CSS Custom Properties Generator
export const generateCSSVariables = () => {
  const cssVars: Record<string, string> = {};

  // Generate color variables
  Object.entries(designTokens.colors).forEach(([category, colors]) => {
    if (typeof colors === 'object') {
      Object.entries(colors).forEach(([shade, value]) => {
        cssVars[`--color-${category}-${shade}`] = value;
      });
    } else {
      cssVars[`--color-${category}`] = colors;
    }
  });

  // Generate spacing variables
  Object.entries(designTokens.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });

  // Generate typography variables
  Object.entries(designTokens.typography.fontSize).forEach(([key, value]) => {
    cssVars[`--font-size-${key}`] = value;
  });

  return cssVars;
};

// 🍽️ Restaurant-Specific Theme Variants
export const restaurantThemes = {
  elegant: {
    primary: designTokens.colors.primary[600],
    secondary: designTokens.colors.secondary[500],
    accent: designTokens.colors.accent.yellow,
    background: designTokens.colors.neutral[50],
  },
  cozy: {
    primary: designTokens.colors.secondary[600],
    secondary: designTokens.colors.primary[400],
    accent: designTokens.colors.accent.orange,
    background: designTokens.colors.neutral[100],
  },
  modern: {
    primary: designTokens.colors.primary[500],
    secondary: designTokens.colors.neutral[700],
    accent: designTokens.colors.accent.blue,
    background: designTokens.colors.neutral[50],
  },
  premium: {
    primary: designTokens.colors.primary[700],
    secondary: designTokens.colors.secondary[800],
    accent: designTokens.colors.accent.purple,
    background: designTokens.colors.primary[50],
  },
} as const;

export type RestaurantTheme = keyof typeof restaurantThemes;
export type DesignTokens = typeof designTokens;
