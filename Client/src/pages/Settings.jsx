import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, PaletteIcon, TypeIcon, SparklesIcon } from 'lucide-react';
import ThemeGrid from '../components/ThemeGrid';
import useStore from '../store/useStore';

const fonts = [
  { name: 'Geist', family: 'font-geist' },
  { name: 'Instrument Serif', family: 'font-instrument' },
  { name: 'Manrope', family: 'font-manrope' },
  { name: 'Space Grotesk', family: 'font-space' },
  { name: 'Sora', family: 'font-sora' },
  { name: 'Plus Jakarta Sans', family: 'font-jakarta' },
  { name: 'DM Sans', family: 'font-dm' },
];

const Settings = () => {
  const { font, setFont } = useStore();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-12 space-y-12"
    >
      <div className="flex items-center justify-between">
          <Link to="/" className="p-2 -ml-2 text-muted hover:text-text transition-colors">
            <ArrowLeftIcon size={20} />
          </Link>
          <h2 className="text-2xl font-instrument">Preferences</h2>
          <div className="w-8" />
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
            <PaletteIcon size={18} className="text-accent" />
            <h3 className="text-sm font-mono uppercase tracking-widest text-muted">Aesthetics (DaisyUI Themes)</h3>
        </div>
        <ThemeGrid />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
            <TypeIcon size={18} className="text-accent" />
            <h3 className="text-sm font-mono uppercase tracking-widest text-muted">Typography</h3>
        </div>
        
        <div className="bg-panel border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {fonts.map((f) => (
                <button
                    key={f.name}
                    onClick={() => setFont(f.name)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface/50 transition-colors text-left"
                >
                    <div className="flex flex-col">
                        <span className={`text-lg ${f.family}`}>{f.name}</span>
                        <span className="text-xs text-muted font-mono">Example alphabet abc-123</span>
                    </div>
                    {font === f.name && (
                        <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_8px_var(--color-accent)]" />
                    )}
                </button>
            ))}
        </div>

        <div className="p-8 bg-surface rounded-2xl border-2 border-border border-dashed text-center space-y-4">
            <p className="text-xs font-mono text-muted uppercase tracking-widest">Live Preview</p>
            <p className={`text-2xl transition-all duration-300 font-${font.toLowerCase().replace(/\s+/g, '')}`}>
                The quick brown fox jumps over the lazy dog — 0123456789
            </p>
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted opacity-50 pb-12">
          <SparklesIcon size={12} />
          <span>Preferences persist to local storage</span>
      </div>
    </motion.div>
  );
};

export default Settings;
