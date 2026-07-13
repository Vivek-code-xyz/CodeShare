import React from 'react';
import useStore from '../store/useStore';
import { clsx } from 'clsx';

const themes = [
  'tricolor', 'light', 'dark', 'cupcake', 'corporate', 'business',
  'nord', 'winter', 'luxury', 'dracula'
];

const themeSwatches = {
  tricolor: ['#2563eb', '#14b8a6', '#22c55e'],
  light: ['#ffffff', '#0ea5e9', '#e2e8f0'],
  dark: ['#111827', '#4ade80', '#374151'],
};

const ThemeGrid = () => {
  const { theme, setTheme } = useStore();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {themes.map((t) => {
        const swatches = themeSwatches[t] || ['#111827', 'var(--color-accent)', '#64748b'];

        return (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={clsx(
              'p-3 rounded-xl border flex flex-col gap-2 items-start transition-all',
              theme === t ? 'border-accent bg-accent/10' : 'border-border bg-panel hover:border-muted'
            )}
          >
            <div className="flex gap-1 w-full">
              {swatches.map((color, index) => (
                <div key={`${t}-${index}`} className="h-4 flex-1 rounded-sm" style={{ background: color }} />
              ))}
            </div>
            <span className="text-xs font-mono capitalize">{t}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeGrid;
