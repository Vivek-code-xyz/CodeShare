import React from 'react';
import { motion } from 'framer-motion';
import { FileIcon, ImageIcon, VideoIcon, XIcon, FileTextIcon } from 'lucide-react';

const FileCard = ({ file, index, onRemove }) => {
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon className="text-blue-400" size={20} />;
    if (type.startsWith('video/')) return <VideoIcon className="text-purple-400" size={20} />;
    if (type.startsWith('text/')) return <FileTextIcon className="text-green-400" size={20} />;
    return <FileIcon className="text-muted" size={20} />;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 bg-panel border border-border rounded-xl group"
    >
      <div className="p-2 bg-surface rounded-lg">
        {getFileIcon(file.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-geist truncate" title={file.name}>
          {file.name}
        </h4>
        <p className="text-xs text-muted font-mono">
          {formatSize(file.size)}
        </p>
      </div>

      <button
        onClick={() => onRemove(index)}
        className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
      >
        <XIcon size={16} />
      </button>
    </motion.div>
  );
};

export default FileCard;
