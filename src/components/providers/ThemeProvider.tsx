'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (value: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'lawvera-theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [initialized, setInitialized] = useState(false);

  const applyThemeClass = useCallback((value: ThemeMode) => {
    if (typeof document === 'undefined') return;
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(value === 'dark' ? 'theme-dark' : 'theme-light');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial =
      stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light';
    setThemeState(initial);
    setInitialized(true);
    applyThemeClass(initial);
  }, [applyThemeClass]);

  useEffect(() => {
    if (!initialized || typeof window === 'undefined') return;
    applyThemeClass(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, initialized, applyThemeClass]);

  const updateTheme = useCallback((value: ThemeMode) => {
    setThemeState(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme: updateTheme,
      toggleTheme,
    }),
    [theme, updateTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

