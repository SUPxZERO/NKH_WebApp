import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Next, we will set up the CSRF token as a common header with Axios so that
 * all outgoing HTTP requests automatically have it attached. This is just
 * a simple convenience so we don't have to attach every token manually.
 */

const token = document.head.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;

if (token && token.content) {
  window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
  console.warn('CSRF token not found in meta tag');
}

/**
 * Helper to get cookie value
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

/**
 * Sprint: Multi-Language Support
 * Attach the X-Inertia-Locale header to all requests based on the cookie.
 * This ensures API requests return the correct language data.
 */
const locale = getCookie('NEXT_LOCALE') || 'en';
window.axios.defaults.headers.common['X-Inertia-Locale'] = locale;

/**
 * Sprint P15: Add Telegram user ID header for iframe authentication.
 * This ensures Inertia navigations and all axios requests include the Telegram user ID.
 */
try {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    const telegramUserId = (window as any).Telegram.WebApp.initDataUnsafe.user.id;
    window.axios.defaults.headers.common['X-Telegram-User-Id'] = String(telegramUserId);

    // SPRINT P16: Add Init Data for authentication
    const initData = (window as any).Telegram.WebApp.initData;
    if (initData) {
      window.axios.defaults.headers.common['X-Telegram-Init-Data'] = initData;
    }

    console.log('[Bootstrap] Telegram headers set:', { userId: telegramUserId, hasInitData: !!initData });
  }
} catch (_) {
  // Telegram not available, ignore
}

