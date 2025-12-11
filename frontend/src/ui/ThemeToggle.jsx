import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`theme-toggle-wrapper ${className}`}>
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label={isDark ? 'Aydınlık temaya geç' : 'Karanlık temaya geç'}
      >
        <Sun
          className={`theme-toggle-icon ${isDark ? 'theme-toggle-icon--hidden' : ''}`}
          size={16}
        />
        <Moon
          className={`theme-toggle-icon ${isDark ? '' : 'theme-toggle-icon--hidden'}`}
          size={16}
        />
      </button>
    </div>
  );
}
