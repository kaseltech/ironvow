'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';

export type ColorTheme = 'navy' | 'charcoal' | 'forest' | 'slate' | 'midnight' | 'plum' | 'coffee' | 'ocean';

const THEME_STORAGE_KEY = 'ironvow_color_theme';

interface ThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  colors: typeof COLOR_THEMES['navy']['colors'];
}

// All dark themes with gold accent
export const COLOR_THEMES: Record<ColorTheme, {
  name: string;
  preview: string;
  colors: {
    bg: string;
    cardBg: string;
    cardBgHover: string;
    border: string;
    borderSubtle: string;
    text: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    accentMuted: string;
    inputBg: string;
    success: string;
    warning: string;
    error: string;
  };
}> = {
  navy: {
    name: 'Navy',
    preview: '#0F2233',
    colors: {
      bg: '#0F2233',
      cardBg: '#1A3550',
      cardBgHover: '#162E45',
      border: 'rgba(201, 167, 90, 0.2)',
      borderSubtle: 'rgba(201, 167, 90, 0.1)',
      text: '#F5F1EA',
      textMuted: 'rgba(245, 241, 234, 0.6)',
      accent: '#C9A75A',
      accentHover: '#DABB6A',
      accentMuted: 'rgba(201, 167, 90, 0.25)',
      inputBg: '#1A3550',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
  charcoal: {
    name: 'Charcoal',
    preview: '#1A1A1A',
    colors: {
      bg: '#121212',
      cardBg: '#1E1E1E',
      cardBgHover: '#2A2A2A',
      border: 'rgba(201, 167, 90, 0.2)',
      borderSubtle: 'rgba(201, 167, 90, 0.1)',
      text: '#E8E8E8',
      textMuted: 'rgba(232, 232, 232, 0.6)',
      accent: '#D4B56A',
      accentHover: '#E5C87A',
      accentMuted: 'rgba(212, 181, 106, 0.25)',
      inputBg: '#1E1E1E',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
  midnight: {
    name: 'Midnight',
    preview: '#08080A',
    colors: {
      bg: '#08080A',
      cardBg: '#131316',
      cardBgHover: '#1A1A1E',
      border: 'rgba(201, 167, 90, 0.15)',
      borderSubtle: 'rgba(201, 167, 90, 0.08)',
      text: '#FAFAFA',
      textMuted: 'rgba(250, 250, 250, 0.6)',
      accent: '#D4B56A',
      accentHover: '#E5C87A',
      accentMuted: 'rgba(212, 181, 106, 0.20)',
      inputBg: '#131316',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
  forest: {
    name: 'Forest',
    preview: '#0D1A14',
    colors: {
      bg: '#0D1A14',
      cardBg: '#152A20',
      cardBgHover: '#1A3528',
      border: 'rgba(201, 167, 90, 0.2)',
      borderSubtle: 'rgba(201, 167, 90, 0.1)',
      text: '#E8F0EB',
      textMuted: 'rgba(232, 240, 235, 0.6)',
      accent: '#C9A75A',
      accentHover: '#DABB6A',
      accentMuted: 'rgba(201, 167, 90, 0.25)',
      inputBg: '#152A20',
      success: '#6BBF8A',
      warning: '#D9A06D',
      error: '#C77070',
    },
  },
  slate: {
    name: 'Slate',
    preview: '#0F172A',
    colors: {
      bg: '#0F172A',
      cardBg: '#1E293B',
      cardBgHover: '#283548',
      border: 'rgba(201, 167, 90, 0.2)',
      borderSubtle: 'rgba(201, 167, 90, 0.1)',
      text: '#E2E8F0',
      textMuted: 'rgba(226, 232, 240, 0.6)',
      accent: '#D4B56A',
      accentHover: '#E5C87A',
      accentMuted: 'rgba(212, 181, 106, 0.25)',
      inputBg: '#1E293B',
      success: '#22C55E',
      warning: '#FB923C',
      error: '#F87171',
    },
  },
  plum: {
    name: 'Plum',
    preview: '#1A0F1F',
    colors: {
      bg: '#1A0F1F',
      cardBg: '#2A1A32',
      cardBgHover: '#352040',
      border: 'rgba(201, 167, 90, 0.2)',
      borderSubtle: 'rgba(201, 167, 90, 0.1)',
      text: '#F0E8F4',
      textMuted: 'rgba(240, 232, 244, 0.6)',
      accent: '#D4B56A',
      accentHover: '#E5C87A',
      accentMuted: 'rgba(212, 181, 106, 0.25)',
      inputBg: '#2A1A32',
      success: '#A78BFA',
      warning: '#F0A060',
      error: '#F87171',
    },
  },
  coffee: {
    name: 'Coffee',
    preview: '#1A1410',
    colors: {
      bg: '#1A1410',
      cardBg: '#2A221A',
      cardBgHover: '#352A20',
      border: 'rgba(201, 167, 90, 0.2)',
      borderSubtle: 'rgba(201, 167, 90, 0.1)',
      text: '#F4EDE6',
      textMuted: 'rgba(244, 237, 230, 0.6)',
      accent: '#D4A860',
      accentHover: '#E5BB70',
      accentMuted: 'rgba(212, 168, 96, 0.25)',
      inputBg: '#2A221A',
      success: '#A8C080',
      warning: '#E5A060',
      error: '#D07070',
    },
  },
  ocean: {
    name: 'Ocean',
    preview: '#0A1520',
    colors: {
      bg: '#0A1520',
      cardBg: '#122535',
      cardBgHover: '#183045',
      border: 'rgba(201, 167, 90, 0.2)',
      borderSubtle: 'rgba(201, 167, 90, 0.1)',
      text: '#E6F0F8',
      textMuted: 'rgba(230, 240, 248, 0.6)',
      accent: '#D4B56A',
      accentHover: '#E5C87A',
      accentMuted: 'rgba(212, 181, 106, 0.25)',
      inputBg: '#122535',
      success: '#22D3EE',
      warning: '#F0A060',
      error: '#F87171',
    },
  },
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('navy');
  const [mounted, setMounted] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    async function loadTheme() {
      let savedTheme: string | null = null;

      // Try Capacitor Preferences first (for iOS)
      try {
        const { value } = await Preferences.get({ key: THEME_STORAGE_KEY });
        if (value) savedTheme = value;
      } catch {
        // Preferences not available
      }

      // Also check localStorage (for web and as backup)
      if (!savedTheme) {
        savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      }

      if (savedTheme && COLOR_THEMES[savedTheme as ColorTheme]) {
        setColorThemeState(savedTheme as ColorTheme);
      }
      setMounted(true);
    }
    loadTheme();
  }, []);

  // Save theme when it changes
  const saveTheme = useCallback(async (theme: ColorTheme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    try {
      await Preferences.set({ key: THEME_STORAGE_KEY, value: theme });
    } catch {
      // Preferences not available
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      saveTheme(colorTheme);
      document.documentElement.setAttribute('data-theme', colorTheme);
      document.body.style.backgroundColor = COLOR_THEMES[colorTheme].colors.bg;
      document.documentElement.style.backgroundColor = COLOR_THEMES[colorTheme].colors.bg;
    }
  }, [colorTheme, mounted, saveTheme]);

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
  };

  const colors = COLOR_THEMES[colorTheme].colors;
  const currentTheme = mounted ? colorTheme : 'navy';
  const currentColors = mounted ? colors : COLOR_THEMES['navy'].colors;

  return (
    <ThemeContext.Provider value={{
      colorTheme: currentTheme,
      setColorTheme,
      colors: currentColors
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
