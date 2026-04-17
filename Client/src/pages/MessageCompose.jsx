import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ShieldCheckIcon, Loader2Icon, ArrowLeftIcon, SparklesIcon, Trash2Icon } from 'lucide-react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore';
import ShareLinkBox from '../components/ShareLinkBox';
import { getApiUrl } from '../lib/api';

const MessageCompose = () => {
  const [content, setContent] = useState('');
  const [destroyOnRead, setDestroyOnRead] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const { messageSession, setMessageSession } = useStore();

  React.useEffect(() => {
    if (messageSession && messageSession.expiresAt && Date.now() > messageSession.expiresAt) {
      setMessageSession(null);
    }
  }, [messageSession, setMessageSession]);

  const handleCreate = async () => {
    if (!content.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await axios.post(getApiUrl('/api/message'), {
        content,
        destroyOnRead
      });
      // Force correct frontend origin on share link regardless of backend reply
      const data = response.data;
      data.shareUrl = `${window.location.origin}/message/${data.id}`;
      setMessageSession(data);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create secret link.');
    } finally {
      setIsCreating(false);
    }
  };

  if (messageSession) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto py-12 space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-accent/20 text-accent rounded-full mb-4">
            <ShieldCheckIcon size={32} />
          </div>
          <h2 className="text-3xl font-instrument">Secret Sealed</h2>
          <p className="text-muted">This secret will {messageSession.destroyOnRead ? 'vanish after the first read' : 'be available for 5 minutes'}.</p>
        </div>

        <ShareLinkBox link={messageSession.shareUrl} />

        <div className="bg-panel border border-border p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Trash2Icon size={14} className="text-danger" />
                <span className="text-xs font-mono text-muted uppercase tracking-widest">Safety Mode</span>
            </div>
            <span className="text-sm font-bold text-danger">
                One-Time View
            </span>
        </div>

        <button 
          onClick={() => setMessageSession(null)}
          className="w-full py-4 bg-panel border border-border rounded-xl text-sm font-bold hover:bg-border transition-colors mt-8"
        >
          Create Another Secret
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-12 space-y-8"
    >
      <div className="flex items-center justify-between">
          <Link to="/" className="p-2 -ml-2 text-muted hover:text-text transition-colors">
            <ArrowLeftIcon size={20} />
          </Link>
          <h2 className="text-2xl font-instrument">Secret Note</h2>
          <div className="w-8" />
      </div>

      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your secret message here..."
            className="w-full h-64 bg-panel border-2 border-border focus:border-accent rounded-2xl p-6 outline-none transition-all resize-none font-geist text-lg"
            maxLength={5000}
          />
          <div className="absolute bottom-4 right-4 text-xs font-mono text-muted">
            {content.length}/5000
          </div>
        </div>

        <div className="flex items-center justify-between bg-panel border border-border p-4 rounded-xl">
          <div className="flex flex-col">
            <span className="font-medium text-sm">Self-Destruct on Read</span>
            <span className="text-xs text-muted">The message will vanish forever after being viewed once.</span>
          </div>
          <div className="form-control">
            <label className="label cursor-pointer p-0">
              <input 
                type="checkbox" 
                checked={destroyOnRead}
                onChange={(e) => setDestroyOnRead(e.target.checked)}
                className="toggle toggle-success" 
              />
            </label>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={isCreating || !content.trim()}
          className="w-full py-4 bg-accent text-surface rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
        >
          {isCreating ? (
            <Loader2Icon size={20} className="animate-spin" />
          ) : (
            <ShieldCheckIcon size={20} />
          )}
          Create Secret Link
        </button>

        {error && <p className="text-danger text-sm text-center">{error}</p>}
      </div>
    </motion.div>
  );
};

export default MessageCompose;
