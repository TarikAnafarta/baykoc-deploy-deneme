import { applyPalette } from './palette';
import { getPreferredTheme } from './preferences';

function bootstrapTheme() {
  if (typeof document === 'undefined') return;
  const theme = getPreferredTheme();
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.setProperty('color-scheme', theme === 'dark' ? 'dark' : 'light');
  applyPalette(theme);
}

bootstrapTheme();
