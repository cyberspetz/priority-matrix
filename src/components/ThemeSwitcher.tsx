"use client";
import React from 'react';
import { useTheme, type Theme } from '@/hooks/useTheme';

interface ThemeSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEME_COLORS = {
  'default-light': {
    primary: '#ff7167',
    secondary: '#9d8cf0',
    background: '#ffffff',
    text: '#0f172a',
  },
  'default-dark': {
    primary: '#ff7167',
    secondary: '#9d8cf0',
    background: '#0f172a',
    text: '#f8fafc',
  },
  'kale-light': {
    primary: '#2d8f3c',
    secondary: '#7cb342',
    background: '#ffffff',
    text: '#0d3818',
  },
  'kale-dark': {
    primary: '#66bb6a',
    secondary: '#9ccc65',
    background: '#0d1f12',
    text: '#e8f5e9',
  },
};

export default function ThemeSwitcher({ isOpen, onClose }: ThemeSwitcherProps) {
  const { theme, setTheme, themeOptions, mounted } = useTheme();

  if (!mounted) return null;

  const handleThemeSelect = (newTheme: Theme) => {
    setTheme(newTheme);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity z-[100] ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto rounded-2xl border transition-all duration-300 z-[101] ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{
          background: 'var(--color-surface-elevated)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-soft)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-900)' }}>
            Choose Theme
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition hover:bg-gray-100"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Theme Options */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Auto Mode */}
          <button
            onClick={() => {
              setTheme(null);
              onClose();
            }}
            className={`w-full rounded-xl border-2 p-4 transition-all ${
              theme === null ? 'border-[var(--color-primary-500)]' : 'border-transparent'
            }`}
            style={{
              background: theme === null ? 'var(--color-surface-muted)' : 'var(--color-surface-muted)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <div className="w-8 h-8 rounded-lg" style={{ background: '#ffffff' }} />
                <div className="w-8 h-8 rounded-lg" style={{ background: '#0f172a' }} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm" style={{ color: 'var(--color-text-900)' }}>
                  Auto
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Follow system preference
                </div>
              </div>
              {theme === null && (
                <svg className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>

          {/* Theme Groups */}
          <div className="pt-2">
            <div className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
              Default
            </div>
            <div className="space-y-2">
              {themeOptions.filter(t => t.category === 'default').map(option => (
                <ThemeOption
                  key={option.id}
                  option={option}
                  isSelected={theme === option.id}
                  onSelect={() => handleThemeSelect(option.id)}
                />
              ))}
            </div>
          </div>

          <div className="pt-2">
            <div className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
              Kale
            </div>
            <div className="space-y-2">
              {themeOptions.filter(t => t.category === 'kale').map(option => (
                <ThemeOption
                  key={option.id}
                  option={option}
                  isSelected={theme === option.id}
                  onSelect={() => handleThemeSelect(option.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ThemeOption({
  option,
  isSelected,
  onSelect,
}: {
  option: any;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const colors = THEME_COLORS[option.id as Theme];

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-xl border-2 p-4 transition-all ${
        isSelected ? 'border-[var(--color-primary-500)]' : 'border-transparent'
      }`}
      style={{
        background: 'var(--color-surface-muted)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Color Preview */}
        <div className="relative">
          <div
            className="w-12 h-12 rounded-lg border"
            style={{
              background: colors.background,
              borderColor: 'var(--color-border-strong)',
            }}
          >
            <div className="flex gap-1 p-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: colors.primary }} />
              <div className="w-2 h-2 rounded-full" style={{ background: colors.secondary }} />
            </div>
          </div>
          {option.mode === 'dark' && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-900 border-2 border-white flex items-center justify-center">
              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </div>
          )}
        </div>

        {/* Theme Info */}
        <div className="flex-1 text-left">
          <div className="font-semibold text-sm" style={{ color: 'var(--color-text-900)' }}>
            {option.name}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {option.description}
          </div>
        </div>

        {/* Selected Indicator */}
        {isSelected && (
          <svg className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  );
}
