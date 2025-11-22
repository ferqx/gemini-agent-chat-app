import { useState, useEffect } from 'react';
import { translations, Language } from '../translations';

export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * Custom hook to manage the application theme (Light, Dark, or System).
 * Handles persistence to localStorage and listens for system preference changes.
 * 
 * @param {Language} language - The current language for translation strings.
 * @returns {Object} An object containing the current theme mode, toggle function, and helper functions for UI.
 */
export const useTheme = (language: Language) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const t = translations[language];

  // Initialize state from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeMode(savedTheme);
    } else {
      setThemeMode('system');
    }
  }, []);

  // Apply theme to DOM and handle System Listener
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (themeMode === 'dark') {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else if (themeMode === 'light') {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        // System mode
        localStorage.removeItem('theme');
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    // Listener for system changes (only active in 'system' mode)
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (themeMode === 'system') {
        if (e.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [themeMode]);

  /**
   * Toggles the theme between System -> Light -> Dark loop.
   */
  const toggleTheme = () => {
    setThemeMode(prev => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  /**
   * Returns the appropriate icon name based on the current theme.
   * @returns {string} Icon name string.
   */
  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light': return 'Sun';
      case 'dark': return 'Moon';
      case 'system': return 'Monitor';
      default: return 'Monitor';
    }
  };

  /**
   * Returns the translated title for the current theme.
   * @returns {string} Translated title.
   */
  const getThemeTitle = () => {
    switch (themeMode) {
      case 'light': return t.themeLight;
      case 'dark': return t.themeDark;
      case 'system': return t.themeSystem;
    }
  };

  return { themeMode, toggleTheme, getThemeIcon, getThemeTitle };
};