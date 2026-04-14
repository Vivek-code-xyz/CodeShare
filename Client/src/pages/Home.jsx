import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { UploadCloudIcon, MessageSquareIcon, ShieldIcon, Trash2Icon } from 'lucide-react';

const Home = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center flex-1 gap-8 py-4"
    >
      <div className="text-center space-y-4">
        <h1 className="text-5xl sm:text-7xl font-instrument">
          Stateless. <span className="text-accent">Ephemeral.</span> Secure.
        </h1>
        <p className="text-muted text-lg sm:text-xl font-geist max-w-xl mx-auto">
          Share files and secret notes that self-destruct after being read or when the timer hits zero. No database. No logs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl px-4">
        <Link to="/upload" className="group">
          <div className="bg-panel border border-border p-8 rounded-2xl flex flex-col items-start gap-4 transition-all duration-300 hover:border-accent hover:scale-[1.02]">
            <div className="p-4 bg-accent/10 text-accent rounded-xl group-hover:bg-accent group-hover:!text-[#ffffff] transition-colors">
              <UploadCloudIcon size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-clip-text">Drop Files</h3>
              <p className="text-muted text-sm mt-1">Share up to 5 files (60MB max) with a temporary download link.</p>
            </div>
          </div>
        </Link>

        <Link to="/message" className="group">
          <div className="bg-panel border border-border p-8 rounded-2xl flex flex-col items-start gap-4 transition-all duration-300 hover:border-accent hover:scale-[1.02]">
            <div className="p-4 bg-accent/10 text-accent rounded-xl group-hover:bg-accent group-hover:!text-[#ffffff] transition-colors">
              <MessageSquareIcon size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Secret Note</h3>
              <p className="text-muted text-sm mt-1">One-time secret notes that vanish forever after the first read.</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex gap-8 text-xs font-mono uppercase tracking-widest text-muted">
        <div className="flex items-center gap-2">
          <ShieldIcon size={14} className="text-accent" />
          <span>RAM Storage</span>
        </div>
        <div className="flex items-center gap-2">
          <Trash2Icon size={14} className="text-danger" />
          <span>Self-Destructing</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
