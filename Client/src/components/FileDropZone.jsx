import React, { useState, useRef } from 'react';
import { UploadCloudIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const FileDropZone = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      onFilesAdded(Array.from(e.target.files));
    }
  };

  return (
    <motion.div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={[
        'w-full min-h-[280px] rounded-2xl border-2 border-dashed',
        'flex flex-col items-center justify-center gap-5',
        'cursor-pointer transition-colors duration-200 select-none',
        isDragging
          ? 'border-accent bg-accent/8 border-solid'
          : 'border-border hover:border-accent/60 hover:bg-accent/5 bg-panel',
      ].join(' ')}
    >
      <input
        type="file"
        multiple
        hidden
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Icon */}
      <div className={[
        'p-5 rounded-full transition-colors duration-200',
        isDragging ? 'bg-accent/20 text-accent' : 'bg-surface text-muted',
      ].join(' ')}>
        <UploadCloudIcon size={40} strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div className="text-center space-y-1.5 px-6">
        <p className={`text-base font-semibold transition-colors ${isDragging ? 'text-accent' : 'text-text'}`}>
          {isDragging ? 'Release to add files' : 'Drag files here or click to browse'}
        </p>
        <p className="text-sm text-muted">Up to 5 files, 60 MB each</p>
      </div>
    </motion.div>
  );
};

export default FileDropZone;
