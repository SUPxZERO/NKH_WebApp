import '../css/app.css';
import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { AppProviders } from '@/app/providers/AppProviders';
import { InertiaWrapper } from '@/app/components/InertiaWrapper';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: async (name) => {
    const page = await resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')) as any;
    // Wrap the page component with InertiaWrapper to provide global components
    page.default.layout = page.default.layout || ((pageNode: React.ReactNode) => <InertiaWrapper>{pageNode}</InertiaWrapper>);
    return page;
  },
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
