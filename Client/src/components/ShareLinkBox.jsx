import React, { useState } from 'react';
import { CopyIcon, CheckIcon, QrCodeIcon, ChevronDownIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

const ShareLinkBox = ({ link }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    } else {
      // Fallback for HTTP/LAN testing on mobile
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 flex items-center min-w-0">
          <input
            type="text"
            readOnly
            value={link}
            className="bg-transparent border-none outline-none w-full text-sm font-mono truncate"
          />
        </div>
        <button
          onClick={handleCopy}
          className="p-3 bg-accent text-surface rounded-xl hover:scale-105 transition-transform active:scale-95"
          title="Copy to clipboard"
        >
          {copied ? <CheckIcon size={20} /> : <CopyIcon size={20} />}
        </button>
        <button
          onClick={() => setShowQR(!showQR)}
          className="p-3 bg-panel border border-border text-text rounded-xl hover:bg-border transition-colors"
          title="Toggle QR Code"
        >
          <QrCodeIcon size={20} />
        </button>
      </div>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
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
