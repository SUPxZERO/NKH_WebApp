import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

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
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: {
                    DEFAULT: '#FF2D20',
                    light: '#FF4433',
                    dark: '#CC1810',
                },
                secondary: {
                    DEFAULT: '#1B1B18',
                    light: '#3E3E3A',
                    dark: '#0A0A0A',
                },
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444',
                info: '#3B82F6',
                background: {
                    light: '#FDFDFC',
                    dark: '#161615',
                },
                text: {
                    primary: '#1B1B18',
                    secondary: '#706F6C',
                    light: '#EDEDEC',
                },
            },
        },
    },

    plugins: [forms],
};
