import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore';
import FileDropZone from '../components/FileDropZone';
import FileCard from '../components/FileCard';
import ShareLinkBox from '../components/ShareLinkBox';
import axios from 'axios';
import { AlertCircleIcon, Loader2Icon, ArrowLeftIcon, SparklesIcon, ClockIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import CountdownTimer from '../components/CountdownTimer';
import { getApiUrl } from '../lib/api';

const Upload = () => {
  const { uploadFiles, addFiles, removeFile, uploadSession, setUploadSession, clearUploadFiles } = useStore();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (uploadSession && uploadSession.expiresAt && Date.now() > uploadSession.expiresAt) {
      setUploadSession(null);
    }
  }, [uploadSession, setUploadSession]);

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    uploadFiles.forEach(file => formData.append('files', file));

    try {
      const response = await axios.post(getApiUrl('/api/file/upload'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Force correct frontend origin on share link regardless of backend reply
      const data = response.data;
      data.shareUrl = `${window.location.origin}/file/${data.id}`;
      setUploadSession(data);
      clearUploadFiles();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (uploadSession) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg mx-auto py-16 px-4 space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-accent/15 text-accent rounded-full mb-2">
            <SparklesIcon size={36} />
          </div>
          <h2 className="text-4xl font-instrument">Drop Created!</h2>
          <p className="text-muted text-sm">Anyone with this link can download your files for the next 7 minutes.</p>
        </div>

        <ShareLinkBox link={uploadSession.shareUrl} />

        <div className="bg-panel border border-border p-6 rounded-xl flex flex-col items-center gap-2">
          <CountdownTimer expiresAt={uploadSession.expiresAt} />
        </div>

        <button
          onClick={() => setUploadSession(null)}
          className="w-full py-4 bg-panel border border-border rounded-xl text-sm font-bold hover:bg-border transition-colors"
        >
          Create New Drop
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto py-6 sm:py-10 px-4 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link to="/" className="p-2 -ml-2 text-muted hover:text-text transition-colors rounded-lg hover:bg-panel">
          <ArrowLeftIcon size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-instrument">Upload Files</h2>
          <p className="text-xs text-muted font-mono mt-0.5">Up to 5 files · 60 MB each · 7 min expiry</p>
        </div>
      </div>

      {/* Drop zone */}
      <FileDropZone onFilesAdded={addFiles} />

      {/* File list */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted uppercase tracking-widest px-1">
            {uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''} selected
          </p>
          <AnimatePresence>
            {uploadFiles.map((file, idx) => (
              <FileCard key={`${file.name}-${idx}`} file={file} index={idx} onRemove={removeFile} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Upload button */}
      {uploadFiles.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full py-4 bg-accent text-surface rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-accent/10"
        >
          {isUploading ? (
            <>
              <Loader2Icon size={20} className="animate-spin" />
               Generating Link...
            </>
          ) : (
            <>
              <SparklesIcon size={20} />
              Generate Share Link ({uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''})
            </>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger text-sm">
          <AlertCircleIcon size={18} className="shrink-0" />
          {error}
        </div>
      )}
    </motion.div>
  );
};

export default Upload;
