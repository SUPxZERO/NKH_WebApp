import '../css/app.css';
import './bootstrap';
import { createInertiaApp, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { AppProviders } from '@/app/providers/AppProviders';
import { InertiaWrapper } from '@/app/components/InertiaWrapper';
import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';


/**
 * Sprint: Multi-Language Support
 * Add locale header to all Inertia requests.
 * This ensures page navigations use the correct locale for MenuItem translations.
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

/**
 * Sprint P15: Add Telegram user ID header to all Inertia requests.
 * This ensures page navigations in Telegram iframe include the user ID for auth.
 */
router.on('before', (event) => {
  const headers: Record<string, string> = {};

  // Add locale header
  const locale = getCookie('NEXT_LOCALE') || 'en';
  headers['X-Inertia-Locale'] = locale;

  // Add Telegram headers if available
  try {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      const telegramUserId = String((window as any).Telegram.WebApp.initDataUnsafe.user.id);
      headers['X-Telegram-User-Id'] = telegramUserId;
      console.log('[Inertia] Added headers:', { locale, telegramUserId });
    }
  } catch (_) {
    // Telegram not available, ignore
  }

  // Add all headers to the visit
  event.detail.visit.headers = {
    ...event.detail.visit.headers,
    ...headers,
  };
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
      <ErrorBoundary translations={(props.initialPage.props as any).translations}>
        <AppProviders>
          <App {...props} />
        </AppProviders>
      </ErrorBoundary>
    );
  },
  progress: { color: '#4B5563' },
});

