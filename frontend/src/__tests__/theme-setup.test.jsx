import { beforeEach, describe, expect, it } from 'vitest';
import '../index.css';
import { applyPalette, themePalettes } from '../theme/palette';

const CSS_BG_VAR = '--color-bg';
const CSS_PRIMARY_VAR = '--color-primary';

describe('theme palette + css integration', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style');
  });

  it('applies dark palette variables to the root element', () => {
    applyPalette('dark');
    const root = document.documentElement;
    expect(root.style.getPropertyValue(CSS_BG_VAR).trim()).toBe(themePalettes.dark.background);
    expect(root.style.getPropertyValue(CSS_PRIMARY_VAR).trim()).toBe(themePalettes.dark.primary);
  });

  it('falls back to default palette for unknown theme names', () => {
    applyPalette('unknown-theme');
    const root = document.documentElement;
    expect(root.style.getPropertyValue(CSS_BG_VAR).trim()).toBe(themePalettes.light.background);
  });
});
