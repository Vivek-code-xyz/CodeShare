import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { GhostIcon, ClockIcon, ShieldAlertIcon, ArrowLeftIcon, Trash2Icon, CopyIcon, CheckIcon, CheckCircle2Icon } from 'lucide-react';
import CountdownTimer from '../components/CountdownTimer';

const MessageView = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = () => {
    if (session?.content) {
      navigator.clipboard.writeText(session.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmRead = async () => {
    if (!session) return;

    // Auto-copy to clipboard
    await navigator.clipboard.writeText(session.content);
    setCopied(true);
    setConfirmed(true);

    // Destroy the message on the server
    try {
      await axios.delete(`http://${window.location.hostname}:5000/api/message/${id}`);
    } catch (err) {
      // Already destroyed or expired — that's fine
    }
  };

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await axios.get(`http://${window.location.hostname}:5000/api/message/${id}`);
        setSession(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'This secret has self-destructed.');
      } finally {
        setLoading(false);
      }
    };
    fetchMessage();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 flex items-center justify-center">
            <GhostIcon size={32} className="text-accent animate-bounce" />
        </div>
        <p className="text-muted font-mono">Decrypting secret hash...</p>
    </div>
  );

  if (error) return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto py-24 text-center space-y-6"
    >
        <div className="inline-flex p-6 bg-danger/10 text-danger rounded-full border border-danger/20">
            <Trash2Icon size={48} />
        </div>
        <h2 className="text-3xl font-instrument">Poof! It's Gone.</h2>
        <p className="text-muted max-w-sm mx-auto">
            This secret has self-destructed as requested or has reached its 5-minute lifespan.
        </p>
        <Link to="/" className="inline-block px-8 py-3 bg-panel border border-border rounded-xl hover:bg-border transition-colors">
            Return Home
        </Link>
    </motion.div>
  );

  if (confirmed) return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto py-24 text-center space-y-6"
    >
        <div className="inline-flex p-6 bg-accent/10 text-accent rounded-full border border-accent/20">
            <CheckCircle2Icon size={48} />
        </div>
        <h2 className="text-3xl font-instrument">Secret Received & Destroyed</h2>
        <p className="text-muted max-w-sm mx-auto">
            The message has been copied to your clipboard and the link has been permanently invalidated.
        </p>
        <Link to="/" className="inline-block px-8 py-3 bg-accent text-surface rounded-xl hover:scale-[1.02] active:scale-95 transition-all font-bold">
            Return Home
        </Link>
    </motion.div>
  );

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
          <h2 className="text-2xl font-instrument">Secure Message</h2>
          <div className="w-8" />
      </div>

      <div className="bg-panel border-2 border-border p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />
        <p className="text-lg leading-relaxed whitespace-pre-wrap break-words select-all">
          {session.content}
        </p>
        <div className="mt-6 pt-4 border-t border-border flex justify-end">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent border border-accent/20 rounded-xl text-sm font-medium hover:bg-accent/20 active:scale-95 transition-all"
          >
            {copied ? (
              <><CheckIcon size={16} /> Copied!</>
            ) : (
              <><CopyIcon size={16} /> Copy Message</>
            )}
          </button>
        </div>
      </div>

      {/* Confirm Read Checkbox */}
      <div 
        onClick={handleConfirmRead}
        className="bg-panel border-2 border-dashed border-border hover:border-accent p-6 rounded-2xl flex items-center gap-4 cursor-pointer transition-all group"
      >
        <div className="w-6 h-6 rounded-md border-2 border-muted group-hover:border-accent flex items-center justify-center transition-colors shrink-0">
          {/* empty checkbox visual */}
        </div>
        <div>
          <p className="text-sm font-medium group-hover:text-accent transition-colors">I have read this secret</p>
          <p className="text-xs text-muted">Checking this will copy the message to your clipboard and permanently destroy the link</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-panel border border-border p-6 rounded-2xl flex flex-col items-center gap-4 text-center">
          <CountdownTimer expiresAt={session.expiresAt} />
        </div>

        <div className="bg-panel border border-border p-6 rounded-2xl flex flex-col justify-center items-center gap-2 text-center">
            {session.destroyOnRead ? (
                <>
                    <div className="p-2 bg-danger/10 text-danger rounded-full">
                        <ShieldAlertIcon size={24} />
                    </div>
                    <p className="text-sm font-medium">One-Time Read</p>
                    <p className="text-xs text-muted">Confirm below to claim and destroy.</p>
                </>
            ) : (
                <>
                    <div className="p-2 bg-accent/10 text-accent rounded-full">
                        <ClockIcon size={24} />
                    </div>
                    <p className="text-sm font-medium">Timed Secret</p>
                    <p className="text-xs text-muted">Available until the timer hits zero.</p>
                </>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageView;
