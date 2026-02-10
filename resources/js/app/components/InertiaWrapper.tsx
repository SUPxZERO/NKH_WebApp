import { PropsWithChildren } from 'react';
import { ShortcutsProvider } from '@/app/providers/ShortcutsProvider';
import { FoodDetailProvider } from '@/app/providers/FoodDetailProvider';
import { AuthProvider } from '@/app/providers/AuthProvider';

import { LanguageProvider } from '@/app/context/LanguageContext';
import PWAInstallPrompt from '@/app/components/ui/PWAInstallPrompt';

/**
 * Wrapper component that renders inside the Inertia App component.
 * This ensures that components using usePage() have access to the Inertia context.
 * 
 * ShortcutsProvider and FoodDetailProvider are placed here (not in AppProviders)
 * because they use hooks (useAuth, useModalHotkeys) that call usePage() - 
 * this requires being inside the Inertia component tree.
 */
export function InertiaWrapper({ children }: PropsWithChildren) {
  return (
    <LanguageProvider>
      <FoodDetailProvider>
        <AuthProvider>
          <ShortcutsProvider>
            {children}
            <PWAInstallPrompt />
          </ShortcutsProvider>
        </AuthProvider>
      </FoodDetailProvider>
    </LanguageProvider>
  );
}
