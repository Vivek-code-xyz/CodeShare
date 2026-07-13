import React, { useState } from 'react';
import { CopyIcon, CheckIcon, QrCodeIcon, HashIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

const copyText = (value) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback copy failed', err);
  }
  document.body.removeChild(textArea);
};

const ShareLinkBox = ({ link, code }) => {
  const [copied, setCopied] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const handleCopy = (value, type) => {
    copyText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {code && (
        <div className="bg-surface border border-accent/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_18px_50px_rgba(20,184,166,0.12)]">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-accent/12 text-accent rounded-xl">
              <HashIcon size={22} />
            </div>
            <div>
              <p className="text-xs text-muted font-mono uppercase tracking-widest">Receive Code</p>
              <p className="text-4xl font-black tracking-[0.16em] text-text leading-tight">{code}</p>
            </div>
          </div>
          <button
            onClick={() => handleCopy(code, 'code')}
            className="h-12 px-5 bg-accent text-surface rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform"
            title="Copy receive code"
          >
            {copied === 'code' ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
            <span>{copied === 'code' ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 flex items-center min-w-0">
          <input
            type="text"
            readOnly
            value={link}
            className="bg-transparent border-none outline-none w-full text-sm font-mono truncate"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleCopy(link, 'link')}
            className="flex-1 sm:flex-none p-3 bg-accent text-surface rounded-xl hover:scale-105 transition-transform active:scale-95"
            title="Copy link"
          >
            {copied === 'link' ? <CheckIcon size={20} /> : <CopyIcon size={20} />}
          </button>
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex-1 sm:flex-none p-3 bg-panel border border-border text-text rounded-xl hover:bg-border transition-colors"
            title="Toggle QR Code"
          >
            <QrCodeIcon size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col items-center gap-4 py-2"
          >
            <div className="p-4 bg-white rounded-xl">
              <QRCodeSVG value={link} size={160} />
            </div>
            <p className="text-xs text-muted font-mono uppercase tracking-widest">Scan to access</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareLinkBox;
