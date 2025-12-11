import { DEFAULT_THEME } from './palette';

export const STORAGE_VALUE_KEY = 'baykoc.theme.value';
export const STORAGE_MODE_KEY = 'baykoc.theme.mode';

export function getSystemTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch (error) {
    return DEFAULT_THEME;
  }
}

export function getStoredMode() {
  if (typeof window === 'undefined') return 'system';
  try {
    return window.localStorage.getItem(STORAGE_MODE_KEY) || 'system';
  } catch (error) {
    return 'system';
  }
}

export function getPreferredTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const storedMode = window.localStorage.getItem(STORAGE_MODE_KEY);
    if (storedMode === 'manual') {
      const storedTheme = window.localStorage.getItem(STORAGE_VALUE_KEY);
      if (storedTheme === 'dark' || storedTheme === 'light') {
        return storedTheme;
      }
    }
  } catch (error) {
    // ignore read issues; fall back to system preference
  }
  return getSystemTheme();
}
