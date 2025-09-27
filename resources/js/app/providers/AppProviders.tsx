import { PropsWithChildren, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from '@/app/store/theme';
import ErrorBoundary from '@/app/components/ui/ErrorBoundary';
import PWAInstallPrompt from '@/app/components/ui/PWAInstallPrompt';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  const initTheme = useThemeStore((s) => s.init);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(17,17,17,0.9)',
              color: '#fff',
              borderRadius: '12px',
              backdropFilter: 'blur(8px)',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#111' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#111' } },
          }}
        />
        <PWAInstallPrompt />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
