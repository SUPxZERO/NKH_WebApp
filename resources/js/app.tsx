import '../css/app.css';
import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { AppProviders } from '@/app/providers/AppProviders';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) =>
    resolvePageComponent(`../js/${name}.tsx`, import.meta.glob('./**/*.tsx')),
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(
      <AppProviders>
        <App {...props} />
      </AppProviders>
    );
  },
  progress: { color: '#4B5563' },
});
