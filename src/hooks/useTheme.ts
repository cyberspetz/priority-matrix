"use client";
import { useEffect, useState } from 'react';

export type Theme = 'default-light' | 'default-dark' | 'kale-light' | 'kale-dark';

export interface ThemeOption {
  id: Theme;
  name: string;
  description: string;
  category: 'default' | 'kale';
  mode: 'light' | 'dark';
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'default-light',
    name: 'Default Light',
    description: 'Original light theme with coral accents',
    category: 'default',
    mode: 'light',
  },
  {
    id: 'default-dark',
    name: 'Default Dark',
    description: 'Original dark theme with coral accents',
    category: 'default',
    mode: 'dark',
  },
  {
    id: 'kale-light',
    name: 'Kale Light',
    description: 'Fresh, natural green theme',
    category: 'kale',
    mode: 'light',
  },
  {
    id: 'kale-dark',
    name: 'Kale Dark',
    description: 'Deep, muted green theme',
    category: 'kale',
    mode: 'dark',
  },
];

const THEME_STORAGE_KEY = 'priority-matrix-theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme | null>(null);
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;

    if (savedTheme && THEME_OPTIONS.find(t => t.id === savedTheme)) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to auto (no theme attribute, uses prefers-color-scheme)
      setThemeState(null);
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const applyTheme = (newTheme: Theme | null) => {
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', newTheme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const setTheme = (newTheme: Theme | null) => {
    setThemeState(newTheme);

    if (newTheme) {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      applyTheme(newTheme);
    } else {
      localStorage.removeItem(THEME_STORAGE_KEY);
      applyTheme(null);
    }
  };

  const currentThemeOption = theme ? THEME_OPTIONS.find(t => t.id === theme) : null;

  return {
    theme,
    setTheme,
    currentThemeOption,
    mounted,
    themeOptions: THEME_OPTIONS,
  };
}
