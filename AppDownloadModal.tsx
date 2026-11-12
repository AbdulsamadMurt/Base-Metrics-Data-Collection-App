import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Smartphone, X, Check, Copy, ExternalLink, Share2 } from 'lucide-react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (appUrl) {
      QRCode.toDataURL(appUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0d1117',
          light: '#ffffff'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate QR code:', err));
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [appUrl]);

  const handleCopyLink = () => {
    if (navigator.clipboard && appUrl) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'BaseMetrics-Mobile-Barcode.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallSuccess(true);
    }
    setDeferredPrompt(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0d1117] text-[#c9d1d9] border border-[#30363d] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.jpeg" 
              alt="Base Metrics Logo" 
              className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 border border-[#30363d] shadow-sm shrink-0" 
            />
            <div>
              <h3 className="font-semibold text-[#f0f6fc] text-sm">Download Base Metrics App</h3>
              <p className="text-[11px] text-[#8b949e]">Consulting &bull; Mobile Phone Barcode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#f0f6fc] p-1.5 rounded-lg hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-center">
          {/* QR Code Container */}
          <div className="inline-block p-4 bg-white rounded-2xl shadow-md border-4 border-[#21262d]">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Base Metrics App Barcode"
                className="w-48 h-48 mx-auto"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                Generating Barcode...
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#f0f6fc]">
              Scan with your Phone Camera
            </p>
            <p className="text-[11px] text-[#8b949e]">
              Point your Android or iPhone camera at this barcode to open the web app immediately in the field.
            </p>
          </div>

          {/* Quick Install Button if supported */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="w-full py-2.5 px-4 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-sm"
            >
              <Smartphone className="w-4 h-4" />
              <span>Install Directly on This Device</span>
            </button>
          )}

          {installSuccess && (
            <div className="p-2.5 bg-[#238636]/15 border border-[#238636]/40 rounded-xl text-[#2ea043] text-xs flex items-center justify-center space-x-2">
              <Check className="w-4 h-4" />
              <span>App installed successfully!</span>
            </div>
          )}

          {/* App URL and Copy */}
          <div className="flex items-center space-x-2 bg-[#161b22] border border-[#30363d] rounded-xl p-2 text-left">
            <span className="text-[11px] font-mono text-[#8b949e] truncate flex-1 pl-1">
              {appUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1 text-[11px] font-medium bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] rounded-lg transition-colors flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2ea043]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#8b949e]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Install Instructions */}
          <div className="text-left bg-[#161b22] border border-[#21262d] rounded-xl p-3.5 space-y-2 text-xs">
            <p className="font-semibold text-[#f0f6fc] flex items-center text-[11px] uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5 mr-1.5 text-[#58a6ff]" />
              How to Save App to Phone Home Screen:
            </p>
            <div className="space-y-1.5 text-[11px] text-[#8b949e]">
              <p>
                <strong className="text-[#f0f6fc]">Android (Chrome):</strong> Tap the three dots <span className="font-mono text-[#58a6ff]">⋮</span> at top-right &rarr; Select <span className="text-[#f0f6fc]">"Add to Home screen"</span> or <span className="text-[#f0f6fc]">"Install app"</span>.
              </p>
              <p>
                <strong className="text-[#f0f6fc]">iPhone (Safari):</strong> Tap the Share button <span className="text-[#58a6ff]">⬆</span> at bottom &rarr; Scroll down & select <span className="text-[#f0f6fc]">"Add to Home Screen"</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between">
          <button
            onClick={handleDownloadQr}
            className="text-xs text-[#58a6ff] hover:text-[#79c0ff] font-medium flex items-center space-x-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>Download Barcode PNG</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
