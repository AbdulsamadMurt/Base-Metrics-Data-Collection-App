import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, CheckCircle2, Eye, X } from 'lucide-react';

interface PhotoCaptureProps {
  label: string;
  sublabel?: string;
  value?: string;
  onChange: (base64: string | undefined) => void;
  required?: boolean;
}

export const compressImage = (file: File, maxDim = 960, quality = 0.72): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Image decode error'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
};

const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  label,
  sublabel = 'Take a live photo or upload an image of the students / classroom',
  value,
  onChange,
  required = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    try {
      const compressedDataUrl = await compressImage(file, 960, 0.72);
      onChange(compressedDataUrl);
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setProcessing(false);
      // Reset input so same file can be re-selected if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getEstimatedSizeKb = (dataUrl?: string) => {
    if (!dataUrl) return 0;
    const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
    return Math.round((base64Length * 3) / 4 / 1024);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#f0f6fc] flex items-center space-x-1">
          <span>{label}</span>
          {required && <span className="text-red-400">*</span>}
        </label>
        {value && (
          <span className="text-[11px] text-[#2ea043] bg-[#238636]/15 border border-[#238636]/30 px-2 py-0.5 rounded-md font-mono flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {getEstimatedSizeKb(value)} KB attached
          </span>
        )}
      </div>

      <p className="text-[11px] text-[#8b949e]">{sublabel}</p>

      {/* Hidden file input supporting camera capture on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-[#30363d] bg-[#0d1117] p-2.5">
          <div className="flex items-center space-x-4">
            <img
              src={value}
              alt="Learner or classroom capture"
              className="w-20 h-20 object-cover rounded-lg border border-[#30363d] cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setShowModal(true)}
            />
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-semibold text-[#f0f6fc]">Student / Classroom Photo Captured</p>
              <p className="text-[10px] text-[#8b949e]">
                Optimized for fast mobile upload and offline reliability.
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="px-2.5 py-1 text-xs bg-[#161b22] border border-[#30363d] rounded-lg text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#f0f6fc] flex items-center space-x-1 font-medium transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-lg text-[#58a6ff] hover:bg-[#58a6ff]/20 flex items-center space-x-1 font-medium transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange(undefined)}
                  className="px-2.5 py-1 text-xs bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 flex items-center space-x-1 font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-[#30363d] hover:border-[#58a6ff] bg-[#0d1117] hover:bg-[#161b22] rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
        >
          {processing ? (
            <div className="flex flex-col items-center space-y-2 py-2">
              <div className="w-8 h-8 border-3 border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#58a6ff] font-medium">Optimizing photo for upload...</p>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-[#21262d] border border-[#30363d] text-[#58a6ff] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#f0f6fc]">
                  Click to Take Photo or Upload Image
                </p>
                <p className="text-[10px] text-[#8b949e] mt-0.5">
                  Uses device camera on mobile or file gallery on desktop
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Full Preview Modal */}
      {showModal && value && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#0d1117] border-b border-[#30363d] text-[#f0f6fc] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-[#58a6ff]" />
                <span className="text-sm font-semibold">Captured Photo Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-[#8b949e] hover:text-[#f0f6fc] transition-colors p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 bg-black/60 flex items-center justify-center max-h-[70vh]">
              <img
                src={value}
                alt="Full student or classroom capture"
                className="max-h-[65vh] w-auto object-contain rounded-lg border border-[#30363d]"
              />
            </div>
            <div className="p-3 bg-[#0d1117] border-t border-[#30363d] text-right">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoCapture;
