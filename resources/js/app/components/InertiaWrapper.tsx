import { PropsWithChildren } from 'react';
import CommandPalette from '@/app/components/shortcuts/CommandPalette';
import HelpOverlay from '@/app/components/shortcuts/HelpOverlay';

/**
 * Wrapper component that renders inside the Inertia App component.
 * This ensures that components using usePage() have access to the Inertia context.
 */
export function InertiaWrapper({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <CommandPalette />
      <HelpOverlay />
    </>
  );
}
