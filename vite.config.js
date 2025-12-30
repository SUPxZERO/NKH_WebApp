import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    server: {
        host: '0.0.0.0',
        hmr: {
            host: process.env.VITE_APP_URL ? new URL(process.env.VITE_APP_URL).hostname : 'localhost',
        },
        // Proxy API requests to Laravel backend during development
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
                // Configure cookie handling for cross-port proxying
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes) => {
                        // Remove domain restriction from cookies so they work on any port
                        const setCookie = proxyRes.headers['set-cookie'];
                        if (setCookie) {
                            proxyRes.headers['set-cookie'] = setCookie.map(cookie =>
                                cookie.replace(/;\s*Domain=[^;]*/gi, '')
                                    .replace(/;\s*SameSite=Lax/gi, '; SameSite=Lax')
                            );
                        }
                    });
                },
            },
            '/sanctum': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes) => {
                        const setCookie = proxyRes.headers['set-cookie'];
                        if (setCookie) {
                            proxyRes.headers['set-cookie'] = setCookie.map(cookie =>
                                cookie.replace(/;\s*Domain=[^;]*/gi, '')
                                    .replace(/;\s*SameSite=Lax/gi, '; SameSite=Lax')
                            );
                        }
                    });
                },
            },
            '/login': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            },
            '/logout': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            },
            '/register': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
