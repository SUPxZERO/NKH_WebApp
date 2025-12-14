import { PropsWithChildren, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from '@/app/store/theme';
import ErrorBoundary from '@/app/components/ui/ErrorBoundary';
import PWAInstallPrompt from '@/app/components/ui/PWAInstallPrompt';
import { FoodDetailProvider } from '@/app/providers/FoodDetailProvider';

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
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <FoodDetailProvider>
          {children}
          <Toaster
            position="top-right"
            gutter={8}
            containerStyle={{
              top: 80,
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: isDark ? 'hsl(220 17% 10%)' : 'hsl(0 0% 100%)',
                color: isDark ? 'hsl(210 20% 98%)' : 'hsl(224 71% 4%)',
                borderRadius: '12px',
                border: isDark ? '1px solid hsl(220 17% 18%)' : '1px solid hsl(220 13% 91%)',
                boxShadow: isDark
                  ? '0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -4px rgba(0, 0, 0, 0.25)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 500,
              },
              success: {
                iconTheme: {
                  primary: isDark ? 'hsl(142 71% 50%)' : 'hsl(142 76% 36%)',
                  secondary: isDark ? 'hsl(220 17% 10%)' : 'hsl(0 0% 100%)',
                },
              },
              error: {
                iconTheme: {
                  primary: isDark ? 'hsl(0 72% 55%)' : 'hsl(0 84% 60%)',
                  secondary: isDark ? 'hsl(220 17% 10%)' : 'hsl(0 0% 100%)',
                },
              },
              loading: {
                iconTheme: {
                  primary: isDark ? 'hsl(293 69% 55%)' : 'hsl(293 69% 49%)',
                  secondary: isDark ? 'hsl(220 17% 10%)' : 'hsl(0 0% 100%)',
                },
              },
            }}
          />
          <PWAInstallPrompt />
        </FoodDetailProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
