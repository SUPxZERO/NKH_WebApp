import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggle: () => void;
  init: () => void;
}

function computeIsDark(mode: ThemeMode) {
  if (mode === 'system') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return mode === 'dark';
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: (localStorage.getItem('theme_mode') as ThemeMode) || 'system',
  isDark: false,
  setTheme: (mode: ThemeMode) => {
    localStorage.setItem('theme_mode', mode);
    const isDark = computeIsDark(mode);
    set({ mode, isDark });
    document.documentElement.classList.toggle('dark', isDark);
  },
  toggle: () => {
    const current = get().mode;
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
  init: () => {
    const mode = get().mode;
    const isDark = computeIsDark(mode);
    set({ isDark });
    document.documentElement.classList.toggle('dark', isDark);

    // React to system changes when in system mode
    if (mode === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        const newIsDark = e.matches;
        set({ isDark: newIsDark });
        document.documentElement.classList.toggle('dark', newIsDark);
      };
      mq.addEventListener?.('change', handler);
    }
  },
}));
