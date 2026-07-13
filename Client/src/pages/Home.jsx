import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { UploadCloudIcon, MessageSquareIcon, ShieldIcon, Trash2Icon, HashIcon, ArrowRightIcon, LinkIcon } from 'lucide-react';

const Home = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const normalizedCode = code.replace(/\D/g, '').slice(0, 6);
  const canReceive = normalizedCode.length === 6;

  const handleCodeChange = (event) => {
    setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
  };

  const handleReceive = (event) => {
    event.preventDefault();
    if (canReceive) {
      navigate(`/file/code/${normalizedCode}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col flex-1 gap-8 py-4 sm:py-8"
    >
      <section className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-10 items-stretch w-full max-w-6xl mx-auto">
        <div className="flex flex-col justify-center gap-7 rounded-[2rem] border border-border bg-panel/70 p-6 sm:p-10 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2563eb,#14b8a6,#22c55e)]" />
          <div className="space-y-5 relative">
            <p className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent">
              <ShieldIcon size={14} /> No database file relay
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-instrument leading-[0.95] max-w-3xl">
              Share files with a link, QR, or <span className="text-accent">6-digit code.</span>
            </h1>
            <p className="text-muted text-base sm:text-xl font-geist max-w-2xl">
              Send temporary drops that vanish after download or expiry. Receivers can type the short code and land directly on the download page.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 relative">
            <Link to="/upload" className="group min-h-32 bg-surface border border-border p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:border-accent hover:-translate-y-1">
              <div className="p-3 bg-accent/10 text-accent rounded-xl w-fit group-hover:bg-accent group-hover:!text-[#ffffff] transition-colors">
                <UploadCloudIcon size={26} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Drop Files</h3>
                <p className="text-muted text-sm mt-1">Upload up to 5 files and share instantly.</p>
              </div>
            </Link>

            <Link to="/message" className="group min-h-32 bg-surface border border-border p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:border-accent hover:-translate-y-1">
              <div className="p-3 bg-accent/10 text-accent rounded-xl w-fit group-hover:bg-accent group-hover:!text-[#ffffff] transition-colors">
                <MessageSquareIcon size={26} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Secret Note</h3>
                <p className="text-muted text-sm mt-1">One-time notes that disappear after reading.</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-panel border border-border rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between gap-8 shadow-[0_24px_80px_rgba(20,184,166,0.12)]">
          <div className="space-y-4">
            <div className="p-4 bg-accent/10 text-accent rounded-2xl w-fit">
              <HashIcon size={30} />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-instrument">Receive by Code</h2>
              <p className="text-muted mt-2">Enter the sender's 6-digit code to open the download screen.</p>
            </div>
          </div>

          <form onSubmit={handleReceive} className="space-y-4">
            <label className="block text-xs font-mono text-muted uppercase tracking-widest" htmlFor="receive-code">
              Share Code
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="receive-code"
                inputMode="numeric"
                pattern="[0-9]*"
                value={normalizedCode}
                onChange={handleCodeChange}
                placeholder="000000"
                className="w-full h-16 bg-surface border border-border rounded-2xl px-5 text-3xl font-black tracking-[0.2em] outline-none focus:border-accent transition-colors"
                aria-label="Six digit receive code"
              />
              <button
                type="submit"
                disabled={!canReceive}
                className="h-16 sm:w-16 px-5 bg-accent text-surface rounded-2xl font-bold flex items-center justify-center hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all"
                title="Open drop"
              >
                <ArrowRightIcon size={24} />
              </button>
            </div>
          </form>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono uppercase tracking-widest text-muted">
            <div className="flex items-center gap-2 bg-surface border border-border rounded-xl p-3">
              <LinkIcon size={14} className="text-accent" /> Link and QR
            </div>
            <div className="flex items-center gap-2 bg-surface border border-border rounded-xl p-3">
              <Trash2Icon size={14} className="text-danger" /> Self destruct
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Home;
