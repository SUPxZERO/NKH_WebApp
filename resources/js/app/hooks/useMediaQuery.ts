import { useState, useEffect } from 'react';

// Tailwind breakpoints
const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1600,
} as const;

type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to detect if the viewport matches a media query
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Update state if the match changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

/**
 * Hook to get the current breakpoint
 * @returns Current breakpoint name
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width < breakpoints.sm) {
        setBreakpoint('xs');
      } else if (width < breakpoints.md) {
        setBreakpoint('sm');
      } else if (width < breakpoints.lg) {
        setBreakpoint('md');
      } else if (width < breakpoints.xl) {
        setBreakpoint('lg');
      } else if (width < breakpoints['2xl']) {
        setBreakpoint('xl');
      } else if (width < breakpoints['3xl']) {
        setBreakpoint('2xl');
      } else {
        setBreakpoint('3xl');
      }
    };

    // Initial check
    updateBreakpoint();

    // Listen for resize
    window.addEventListener('resize', updateBreakpoint);

    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, []);

  return breakpoint;
}

/**
 * Hook to check if viewport is mobile (< 768px)
 */
export function useMobile(): boolean {
  return useMediaQuery(`(max-width: ${breakpoints.md - 1}px)`);
}

/**
 * Hook to check if viewport is tablet (768px - 1023px)
 */
export function useTablet(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`);
}

/**
 * Hook to check if viewport is desktop (>= 1024px)
 */
export function useDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
}

/**
 * Hook to check if viewport is at least a certain breakpoint
 * @param bp - Minimum breakpoint
 */
export function useMinBreakpoint(bp: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${breakpoints[bp]}px)`);
}

/**
 * Hook to check if viewport is at most a certain breakpoint
 * @param bp - Maximum breakpoint
 */
export function useMaxBreakpoint(bp: Breakpoint): boolean {
  return useMediaQuery(`(max-width: ${breakpoints[bp] - 1}px)`);
}

/**
 * Hook to get window dimensions
 */
export function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState({ width: 1024, height: 768 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}

/**
 * Hook to detect touch devices
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

/**
 * Hook to detect landscape orientation
 */
export function useLandscape(): boolean {
  return useMediaQuery('(orientation: landscape)');
}

/**
 * Hook to detect portrait orientation
 */
export function usePortrait(): boolean {
  return useMediaQuery('(orientation: portrait)');
}

export { breakpoints };
export type { Breakpoint };

