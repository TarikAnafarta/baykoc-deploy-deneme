import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { applyPalette, DEFAULT_THEME, themePalettes } from '../theme/palette';
import {
  getPreferredTheme,
  getStoredMode,
  getSystemTheme,
  STORAGE_MODE_KEY,
  STORAGE_VALUE_KEY,
} from '../theme/preferences';

let transitionResetTimeoutId;

const temporarilyDisableThemeTransitions = () => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const root = document.documentElement;
  if (!root) return;
  root.classList.add('disable-theme-transitions');
  window.clearTimeout(transitionResetTimeoutId);
  transitionResetTimeoutId = window.setTimeout(() => {
    root.classList.remove('disable-theme-transitions');
  }, 0);
};

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  palette: themePalettes[DEFAULT_THEME],
  mode: 'system',
  toggleTheme: () => {},
  setTheme: () => {},
  setSystemMode: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getStoredMode);
  const [theme, setThemeState] = useState(getPreferredTheme);

  useEffect(() => {
    temporarilyDisableThemeTransitions();
    applyPalette(theme);
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.setProperty('color-scheme', theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      if (mode === 'system') {
        setThemeState(event.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (mode === 'manual') {
        window.localStorage.setItem(STORAGE_MODE_KEY, 'manual');
        window.localStorage.setItem(STORAGE_VALUE_KEY, theme);
      } else {
        window.localStorage.setItem(STORAGE_MODE_KEY, 'system');
        window.localStorage.removeItem(STORAGE_VALUE_KEY);
      }
    } catch (error) {
      // ignore storage issues silently
    }
  }, [mode, theme]);

  const setTheme = (nextTheme) => {
    const normalized = nextTheme === 'dark' ? 'dark' : 'light';
    setMode('manual');
    setThemeState(normalized);
  };

  const toggleTheme = () => {
    setMode('manual');
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setSystemMode = () => {
    setMode('system');
    setThemeState(getSystemTheme());
  };

  const palette = themePalettes[theme] || themePalettes[DEFAULT_THEME];

  const value = useMemo(
    () => ({
      theme,
      mode,
      palette,
      toggleTheme,
      setTheme,
      setSystemMode,
    }),
    [theme, mode, palette],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
