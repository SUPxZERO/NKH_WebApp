import '../css/app.css';
import './bootstrap';
import { createInertiaApp, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { AppProviders } from '@/app/providers/AppProviders';
import { InertiaWrapper } from '@/app/components/InertiaWrapper';
import { ErrorBoundary } from '@/Components/ErrorBoundary'; // Sprint 3 Phase 2

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

/**
 * Sprint P15: Add Telegram user ID header to all Inertia requests.
 * This ensures page navigations in Telegram iframe include the user ID for auth.
 */
router.on('before', (event) => {
  try {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      const telegramUserId = String((window as any).Telegram.WebApp.initDataUnsafe.user.id);
      // Add the header to the visit options
      event.detail.visit.headers = {
        ...event.detail.visit.headers,
        'X-Telegram-User-Id': telegramUserId,
      };
      console.log('[Inertia] Added Telegram user ID header:', telegramUserId);
    }
  } catch (_) {
    // Telegram not available, ignore
  }
});

createInertiaApp({
  title: (title) => `${title} - ${appName} `,
  resolve: async (name) => {
    const page = await resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')) as any;
    // Wrap the page component with InertiaWrapper to provide global components
    // We wrap ALL pages, even if they have a custom layout, to ensure AuthProvider is always available
    const pageLayout = page.default.layout;
    page.default.layout = (pageNode: React.ReactNode) => (
      <InertiaWrapper>
        {pageLayout ? pageLayout(pageNode) : pageNode}
      </InertiaWrapper>
    );
    return page;
  },
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(
      <ErrorBoundary>
        <AppProviders>
          <App {...props} />
        </AppProviders>
      </ErrorBoundary>
    );
  },
  progress: { color: '#4B5563' },
});

