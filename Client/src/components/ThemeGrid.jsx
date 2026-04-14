import React from 'react';
import useStore from '../store/useStore';
import { clsx } from 'clsx';

const themes = [
  "light", "dark", "cupcake", "corporate", "business", 
  "nord", "winter", "luxury", "dracula"
];

const ThemeGrid = () => {
  const { theme, setTheme } = useStore();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={clsx(
            "p-3 rounded-xl border flex flex-col gap-2 items-start transition-all",
            theme === t ? "border-accent bg-accent/10" : "border-border bg-panel hover:border-muted"
          )}
        >
          <div className="flex gap-1 w-full">
            <div className={clsx("h-4 flex-1 rounded-sm", t === 'light' ? 'bg-white' : 'bg-gray-800')} />
            <div className="h-4 flex-1 rounded-sm bg-accent" />
            <div className="h-4 flex-1 rounded-sm bg-secondary" />
          </div>
          <span className="text-xs font-mono capitalize">{t}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeGrid;
