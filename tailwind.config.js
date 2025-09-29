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
            // 🍽️ Restaurant-Focused Typography
            fontFamily: {
                display: ['Playfair Display', 'serif'],
                body: ['Inter', ...defaultTheme.fontFamily.sans],
                accent: ['Dancing Script', 'cursive'],
                mono: ['JetBrains Mono', 'monospace'],
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },

            // 🌈 Revolutionary Restaurant Color Palette
            colors: {
                // Primary Brand Colors - Golden Amber Theme
                primary: {
                    50: '#fefdf8',
                    100: '#fef7e6',
                    200: '#fdecc4',
                    300: '#fbdb8f',
                    400: '#f8c555',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                    DEFAULT: '#f59e0b',
                },

                // Secondary Colors - Rich Food Tones
                secondary: {
                    50: '#f8f4f0',
                    100: '#e8ddd4',
                    200: '#d4c4b0',
                    300: '#b8a082',
                    400: '#9c7c54',
                    500: '#8b5a2b',
                    600: '#7a4a1f',
                    700: '#693c17',
                    800: '#582f11',
                    900: '#47240c',
                    DEFAULT: '#8b5a2b',
                },

                // Accent Colors - Fresh Ingredients
                accent: {
                    green: '#059669',
                    red: '#dc2626',
                    purple: '#7c3aed',
                    orange: '#ea580c',
                    blue: '#0284c7',
                    yellow: '#eab308',
                    pink: '#ec4899',
                },

                // Neutral Palette - Natural Textures
                neutral: {
                    50: '#fafaf9',
                    100: '#f5f5f4',
                    200: '#e7e5e4',
                    300: '#d6d3d1',
                    400: '#a8a29e',
                    500: '#78716c',
                    600: '#57534e',
                    700: '#44403c',
                    800: '#292524',
                    900: '#1c1917',
                },

                // Semantic Colors
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#3b82f6',

                // Special Food Colors
                food: {
                    appetizer: '#fbbf24',
                    main: '#dc2626',
                    dessert: '#ec4899',
                    beverage: '#3b82f6',
                    special: '#8b5cf6',
                },

                // Background Colors
                background: {
                    light: '#fafaf9',
                    dark: '#1c1917',
                    warm: '#fefdf8',
                },
            },

            // 🎭 Enhanced Spacing Scale
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },

            // 🔲 Organic Border Radius
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },

            // 🌫️ Appetite-Inducing Shadows
            boxShadow: {
                'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
                'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
                'strong': '0 8px 32px rgba(0, 0, 0, 0.12)',
                'glow': '0 0 24px rgba(245, 158, 11, 0.3)',
                'food': '0 8px 32px rgba(245, 158, 11, 0.15)',
                'appetite': '0 12px 40px rgba(245, 158, 11, 0.2)',
                'premium': '0 20px 60px rgba(139, 90, 43, 0.25)',
                'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            },

            // 🎨 Background Gradients
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'food-warm': 'linear-gradient(135deg, #fef7e6 0%, #fdecc4 100%)',
                'appetite-glow': 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 50%, rgba(245, 158, 11, 0.05) 100%)',
                'premium-gold': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                'cozy-brown': 'linear-gradient(135deg, #8b5a2b 0%, #693c17 100%)',
            },

            // 🎭 Animation Enhancements
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-in': 'slideIn 0.4s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'appetite-glow': 'appetiteGlow 2s ease-in-out infinite',
                'order-pulse': 'orderPulse 1.5s ease-in-out infinite',
                'kitchen-urgent': 'kitchenUrgent 1s ease-in-out infinite',
                'success-bounce': 'successBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'float': 'float 3s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },

            // 🎯 Custom Keyframes
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateX(-100px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.8)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                appetiteGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)' },
                    '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)' },
                },
                orderPulse: {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.02)' },
                },
                kitchenUrgent: {
                    '0%, 100%': { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                    '50%': { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
                },
                successBounce: {
                    '0%': { transform: 'scale(0)' },
                    '60%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
            },

            // 📱 Enhanced Breakpoints
            screens: {
                'xs': '320px',
                '3xl': '1600px',
            },

            // 🎯 Z-Index Scale
            zIndex: {
                '60': '60',
                '70': '70',
                '80': '80',
                '90': '90',
                '100': '100',
            },

            // 🎨 Backdrop Filters
            backdropBlur: {
                'xs': '2px',
                '4xl': '72px',
            },

            // 📏 Line Heights
            lineHeight: {
                'extra-loose': '2.5',
                '12': '3rem',
            },

            // 🔤 Letter Spacing
            letterSpacing: {
                'extra-wide': '0.1em',
            },

            // 🎭 Transform Scale
            scale: {
                '102': '1.02',
                '103': '1.03',
            },

            // 🌡️ Opacity
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
        // Custom plugin for restaurant-specific utilities
        function({ addUtilities, theme }) {
            const newUtilities = {
                '.glass-food': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                },
                '.food-image': {
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        right: '0',
                        bottom: '0',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 50%, rgba(245, 158, 11, 0.05) 100%)',
                        pointerEvents: 'none',
                    },
                    '& img': {
                        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        filter: 'saturate(1.1) contrast(1.05)',
                    },
                    '&:hover img': {
                        transform: 'scale(1.1)',
                        filter: 'saturate(1.3) contrast(1.1)',
                    },
                },
                '.appetite-button': {
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '0',
                        height: '0',
                        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)',
                        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        transform: 'translate(-50%, -50%)',
                    },
                    '&:hover::before': {
                        width: '300px',
                        height: '300px',
                    },
                    '&:active': {
                        transform: 'scale(0.98)',
                    },
                },
            };
            addUtilities(newUtilities);
        },
    ],
};
