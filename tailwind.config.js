import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
        './resources/js/**/*.ts',
    ],

    theme: {
        extend: {
            // Typography
            fontFamily: {
                display: ['Playfair Display', 'serif'],
                body: ['Inter', ...defaultTheme.fontFamily.sans],
                accent: ['Dancing Script', 'cursive'],
                mono: ['JetBrains Mono', 'monospace'],
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },

            // Colors using CSS variables for theme support
            colors: {
                // Core semantic colors
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",

                // Primary brand color
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                    hover: "hsl(var(--primary-hover))",
                    muted: "hsl(var(--primary-muted))",
                    // Static shades for gradients
                    50: '#fdf4ff',
                    100: '#fae8ff',
                    200: '#f5d0fe',
                    300: '#f0abfc',
                    400: '#e879f9',
                    500: '#d946ef',
                    600: '#c026d3',
                    700: '#a21caf',
                    800: '#86198f',
                    900: '#701a75',
                    950: '#4a044e',
                },

                // Secondary color
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                    hover: "hsl(var(--secondary-hover))",
                    // Static shades
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },

                // Muted colors
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },

                // Accent colors
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },

                // Destructive/Error
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                    muted: "hsl(var(--destructive-muted))",
                },

                // Success
                success: {
                    DEFAULT: "hsl(var(--success))",
                    foreground: "hsl(var(--success-foreground))",
                    muted: "hsl(var(--success-muted))",
                },

                // Warning
                warning: {
                    DEFAULT: "hsl(var(--warning))",
                    foreground: "hsl(var(--warning-foreground))",
                    muted: "hsl(var(--warning-muted))",
                },

                // Info
                info: {
                    DEFAULT: "hsl(var(--info))",
                    foreground: "hsl(var(--info-foreground))",
                    muted: "hsl(var(--info-muted))",
                },

                // Card
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                    hover: "hsl(var(--card-hover))",
                },

                // Popover
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },

                // Sidebar
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    accent: "hsl(var(--sidebar-accent))",
                    'accent-foreground': "hsl(var(--sidebar-accent-foreground))",
                },

                // Header
                header: {
                    DEFAULT: "hsl(var(--header))",
                    foreground: "hsl(var(--header-foreground))",
                },

                // Table
                table: {
                    header: "hsl(var(--table-header))",
                    'header-foreground': "hsl(var(--table-header-foreground))",
                    row: "hsl(var(--table-row))",
                    'row-hover': "hsl(var(--table-row-hover))",
                    border: "hsl(var(--table-border))",
                },

                // Chart colors
                chart: {
                    1: "hsl(var(--chart-1))",
                    2: "hsl(var(--chart-2))",
                    3: "hsl(var(--chart-3))",
                    4: "hsl(var(--chart-4))",
                    5: "hsl(var(--chart-5))",
                },

                // Status colors
                status: {
                    pending: "hsl(var(--status-pending))",
                    'pending-bg': "hsl(var(--status-pending-bg))",
                    preparing: "hsl(var(--status-preparing))",
                    'preparing-bg': "hsl(var(--status-preparing-bg))",
                    ready: "hsl(var(--status-ready))",
                    'ready-bg': "hsl(var(--status-ready-bg))",
                    completed: "hsl(var(--status-completed))",
                    'completed-bg': "hsl(var(--status-completed-bg))",
                    cancelled: "hsl(var(--status-cancelled))",
                    'cancelled-bg': "hsl(var(--status-cancelled-bg))",
                },

                // Food category colors
                food: {
                    appetizer: "hsl(var(--food-appetizer))",
                    main: "hsl(var(--food-main))",
                    dessert: "hsl(var(--food-dessert))",
                    beverage: "hsl(var(--food-beverage))",
                    special: "hsl(var(--food-special))",
                },
            },

            // Border radius using CSS variables
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                xl: "var(--radius-lg)",
                '2xl': "var(--radius-xl)",
                '3xl': '1.5rem',
                '4xl': '2rem',
            },

            // Spacing
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },

            // Box shadows
            boxShadow: {
                'theme-sm': 'var(--shadow-sm)',
                'theme-md': 'var(--shadow-md)',
                'theme-lg': 'var(--shadow-lg)',
                'theme-xl': 'var(--shadow-xl)',
                'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
                'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
                'strong': '0 8px 32px rgba(0, 0, 0, 0.12)',
                'glow-primary': '0 0 24px hsl(var(--primary) / 0.3)',
                'glow-success': '0 0 24px hsl(var(--success) / 0.3)',
                'glow-warning': '0 0 24px hsl(var(--warning) / 0.3)',
                'glow-destructive': '0 0 24px hsl(var(--destructive) / 0.3)',
            },

            // Background images and gradients
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },

            // Animations
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'fade-in-up': 'fadeInUp 0.4s ease-out',
                'slide-in': 'slideIn 0.4s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'spin-slow': 'spin 3s linear infinite',
                'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
                'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'float': 'float 3s ease-in-out infinite',
            },

            // Keyframes
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                pulseSubtle: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.85' },
                },
                bounceSubtle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },

            // Breakpoints
            screens: {
                'xs': '320px',
                '3xl': '1600px',
            },

            // Z-Index
            zIndex: {
                '60': '60',
                '70': '70',
                '80': '80',
                '90': '90',
                '100': '100',
            },

            // Backdrop filters
            backdropBlur: {
                'xs': '2px',
                '4xl': '72px',
            },

            // Line height
            lineHeight: {
                'extra-loose': '2.5',
            },

            // Letter spacing
            letterSpacing: {
                'extra-wide': '0.1em',
            },

            // Scale
            scale: {
                '102': '1.02',
                '103': '1.03',
            },

            // Opacity
            opacity: {
                '15': '0.15',
                '35': '0.35',
                '85': '0.85',
            },
        },
    },

    plugins: [
        forms,
        animate,
        // Custom utilities plugin
        function({ addUtilities }) {
            addUtilities({
                // Glass morphism effects
                '.glass': {
                    'background': 'hsl(var(--card) / 0.8)',
                    'backdrop-filter': 'blur(12px) saturate(180%)',
                    'border': '1px solid hsl(var(--border) / 0.5)',
                },
                '.glass-strong': {
                    'background': 'hsl(var(--card) / 0.95)',
                    'backdrop-filter': 'blur(20px) saturate(180%)',
                    'border': '1px solid hsl(var(--border))',
                },
                // Food card styling
                '.food-card': {
                    'position': 'relative',
                    'overflow': 'hidden',
                    'border-radius': '1.5rem',
                    'background': 'hsl(var(--card))',
                    'border': '1px solid hsl(var(--border))',
                    'transition': 'all 0.3s ease',
                },
                '.food-card:hover': {
                    'transform': 'translateY(-4px)',
                    'box-shadow': '0 12px 40px hsl(var(--primary) / 0.15)',
                },
                // Theme-aware text utilities
                '.text-theme-primary': {
                    'color': 'hsl(var(--foreground))',
                },
                '.text-theme-secondary': {
                    'color': 'hsl(var(--muted-foreground))',
                },
                '.text-theme-muted': {
                    'color': 'hsl(var(--muted-foreground) / 0.7)',
                },
                // Background utilities
                '.bg-theme-primary': {
                    'background': 'hsl(var(--background))',
                },
                '.bg-theme-secondary': {
                    'background': 'hsl(var(--card))',
                },
                '.bg-theme-tertiary': {
                    'background': 'hsl(var(--muted))',
                },
            });
        },
    ],
};
