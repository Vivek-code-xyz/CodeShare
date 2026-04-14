import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from './store/useStore';
import Home from './pages/Home';
import Upload from './pages/Upload';
import FileView from './pages/FileView';
import MessageCompose from './pages/MessageCompose';
import MessageView from './pages/MessageView';
import Settings from './pages/Settings';
import { SettingsIcon, LockIcon } from 'lucide-react';

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/file/:id" element={<FileView />} />
        <Route path="/message" element={<MessageCompose />} />
        <Route path="/message/:id" element={<MessageView />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AnimatePresence>
  );
};

const Navbar = () => {
    return (
        <nav className="flex items-center justify-between py-6 px-4 sm:px-8 max-w-7xl mx-auto w-full">
            <Link to="/" className="flex items-center gap-2 group">
                <div className="p-2 bg-accent text-surface rounded-lg transition-transform group-hover:rotate-12">
                    <LockIcon size={18} />
                </div>
                <span className="font-instrument text-2xl tracking-tight">EphemeralDrop</span>
            </Link>
            
            <Link 
                to="/settings" 
                className="p-3 text-muted hover:text-text hover:bg-panel rounded-full transition-all"
                title="Settings"
            >
                <SettingsIcon size={20} />
            </Link>
        </nav>
    );
};

function App() {
  const { theme, font } = useStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fontClass = `font-${font.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${fontClass} transition-all duration-300`}>
      <Router>
        <Navbar />
        <main className="flex-1 w-full px-4 sm:px-8 overflow-y-auto flex flex-col">
            <AnimatedRoutes />
        </main>
        
        <footer className="py-3 text-center text-[10px] text-muted font-mono uppercase tracking-[0.2em] opacity-30 shrink-0">
            EphemeralDrop &copy; 2026 // Stateless Transmission Protocol
        </footer>
      </Router>
    </div>
  );
}

export default App;
