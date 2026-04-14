import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { DownloadIcon, FileIcon, ShieldAlertIcon, HardDriveIcon, ArrowLeftIcon, CheckCircle2Icon } from 'lucide-react';
import CountdownTimer from '../components/CountdownTimer';

const FileView = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadedFiles, setDownloadedFiles] = useState(new Set());
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get(`http://${window.location.hostname}:5000/api/file/${id}`);
        setSession(response.data);
        // Pre-fill already-downloaded files from server state
        const alreadyDownloaded = new Set();
        response.data.files.forEach((f, i) => {
          if (f.downloaded) alreadyDownloaded.add(i);
        });
        setDownloadedFiles(alreadyDownloaded);
      } catch (err) {
        setError(err.response?.data?.error || 'Drop not found or fully expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  const handleDownload = async (index) => {
    const file = session.files[index];
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/file/download/${id}/${index}`);
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = file.originalName || `file-${index}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Revoke object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);

      // Mark locally as downloaded
      setDownloadedFiles(prev => {
        const next = new Set(prev);
        next.add(index);
        if (session && next.size >= session.files.length) {
          setAllDone(true);
        }
        return next;
      });
    } catch (err) {
      console.error(`[Download] File ${index} failed:`, err);
    }
  };

  const handleDownloadAll = () => {
    session.files.forEach((_, idx) => {
      if (!downloadedFiles.has(idx)) {
        setTimeout(() => handleDownload(idx), idx * 800);
      }
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-muted font-mono animate-pulse">Scanning retrieval codes...</p>
    </div>
  );

  if (error) return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto py-24 text-center space-y-6"
    >
        <div className="inline-flex p-6 bg-danger/10 text-danger rounded-full border border-danger/20">
            <ShieldAlertIcon size={48} />
        </div>
        <h2 className="text-4xl font-instrument">Drop Expired</h2>
        <p className="text-muted max-w-sm mx-auto">
            This file drop has been fully claimed or reached its expiration time. All files have been purged.
        </p>
        <Link to="/" className="inline-block px-8 py-3 bg-panel border border-border rounded-xl hover:bg-border transition-colors">
            Return Home
        </Link>
    </motion.div>
  );

  if (allDone) return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto py-24 text-center space-y-6"
    >
        <div className="inline-flex p-6 bg-accent/10 text-accent rounded-full border border-accent/20">
            <CheckCircle2Icon size={48} />
        </div>
        <h2 className="text-4xl font-instrument">All Files Claimed</h2>
        <p className="text-muted max-w-sm mx-auto">
            Every file in this drop has been downloaded. The share link will be invalidated shortly.
        </p>
        <Link to="/" className="inline-block px-8 py-3 bg-accent text-surface rounded-xl hover:scale-[1.02] active:scale-95 transition-all font-bold">
            Return Home
        </Link>
    </motion.div>
  );

  const remainingCount = session.files.length - downloadedFiles.size;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto py-12 space-y-8"
    >
      <div className="flex items-center justify-between">
          <Link to="/" className="p-2 -ml-2 text-muted hover:text-text transition-colors">
            <ArrowLeftIcon size={20} />
          </Link>
          <h2 className="text-2xl font-instrument">Download Files</h2>
          <div className="w-8" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-panel border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border bg-surface/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-widest">
                    <HardDriveIcon size={14} />
                    <span>File List</span>
                </div>
                <span className="badge badge-sm badge-outline font-mono opacity-50">{session.files.length}</span>
            </div>
            
            <div className="divide-y divide-border">
              {session.files.map((file, idx) => {
                const isDownloaded = downloadedFiles.has(idx);
                return (
                  <div 
                    key={idx} 
                    className={`group p-4 flex items-center justify-between transition-colors ${isDownloaded ? 'bg-accent/5 opacity-60' : 'hover:bg-surface/30 cursor-pointer'}`}
                    onClick={() => !isDownloaded && handleDownload(idx)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileIcon size={20} className={`shrink-0 ${isDownloaded ? 'text-accent' : 'text-muted'}`} />
                      <div className="truncate">
                        <p className={`text-sm font-medium truncate ${isDownloaded ? 'line-through opacity-70' : ''}`}>{file.originalName}</p>
                        <p className="text-xs text-muted font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="p-2">
                      {isDownloaded ? (
                        <CheckCircle2Icon size={20} className="text-accent" />
                      ) : (
                        <DownloadIcon size={20} className="text-muted opacity-0 group-hover:opacity-100 group-hover:text-accent transition-all" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {remainingCount > 0 && (
            <button 
              onClick={handleDownloadAll}
              className="w-full py-4 bg-accent text-surface rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] active:scale-95 transition-all"
            >
              <DownloadIcon size={20} />
              Download {remainingCount === session.files.length ? 'All' : 'Remaining'} Files ({remainingCount})
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-panel border border-border p-6 rounded-2xl flex flex-col items-center gap-6 text-center">
            <CountdownTimer expiresAt={session.expiresAt} />
          </div>

          <div className="bg-panel border border-border p-6 rounded-2xl space-y-3 text-center">
            <p className="text-xs font-mono text-muted uppercase tracking-widest">Progress</p>
            <p className="text-sm font-medium">{downloadedFiles.size} / {session.files.length} claimed</p>
            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-500" 
                style={{ width: `${(downloadedFiles.size / session.files.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted">Link invalidates once all files are claimed</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FileView;
