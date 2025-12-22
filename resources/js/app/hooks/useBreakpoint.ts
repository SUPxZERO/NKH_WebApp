import { useMediaQuery } from './useMediaQuery';

/**
 * Tailwind breakpoints
 */
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1600px',
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to get current breakpoint information
 * @returns Object with breakpoint state and helper methods
 */
export function useBreakpoint() {
  const isXs = useMediaQuery(`(min-width: ${breakpoints.xs})`);
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm})`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md})`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg})`);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl})`);
  const is2Xl = useMediaQuery(`(min-width: ${breakpoints['2xl']})`);
  const is3Xl = useMediaQuery(`(min-width: ${breakpoints['3xl']})`);

  // Determine current breakpoint
  const getCurrentBreakpoint = (): Breakpoint => {
    if (is3Xl) return '3xl';
    if (is2Xl) return '2xl';
    if (isXl) return 'xl';
    if (isLg) return 'lg';
    if (isMd) return 'md';
    if (isSm) return 'sm';
    return 'xs';
  };

  const currentBreakpoint = getCurrentBreakpoint();

  // Helper to check if screen is at least a certain breakpoint
  const isAtLeast = (breakpoint: Breakpoint): boolean => {
    const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
    const currentIndex = order.indexOf(currentBreakpoint);
    const targetIndex = order.indexOf(breakpoint);
    return currentIndex >= targetIndex;
  };

  // Helper to check if screen is at most a certain breakpoint
  const isAtMost = (breakpoint: Breakpoint): boolean => {
    const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
    const currentIndex = order.indexOf(currentBreakpoint);
    const targetIndex = order.indexOf(breakpoint);
    return currentIndex <= targetIndex;
  };

  // Common device checks
  const isMobile = !isMd; // < 768px
  const isTablet = isMd && !isLg; // 768px - 1023px
  const isDesktop = isLg; // >= 1024px
  const isMobileOrTablet = !isLg; // < 1024px

  return {
    // Individual breakpoint checks
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    is3Xl,

    // Current breakpoint
    currentBreakpoint,

    // Helper methods
    isAtLeast,
    isAtMost,

    // Common device types
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
  };
}

/**
 * Hook to check if screen is mobile size
 * @returns boolean indicating if screen is mobile (< 768px)
 */
export function useIsMobile(): boolean {
  return !useMediaQuery(`(min-width: ${breakpoints.md})`);
}

/**
 * Hook to check if screen is tablet size
 * @returns boolean indicating if screen is tablet (768px - 1023px)
 */
export function useIsTablet(): boolean {
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md})`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg})`);
  return isMd && !isLg;
}

/**
 * Hook to check if screen is desktop size
 * @returns boolean indicating if screen is desktop (>= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg})`);
}
