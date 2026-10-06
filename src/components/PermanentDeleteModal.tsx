import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Photo } from '../types/gallery';
import { formatBytes } from '../utils/imageUtils';

interface PermanentDeleteModalProps {
  isOpen: boolean;
  photos: Photo[];
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isProcessing?: boolean;
}

export const PermanentDeleteModal: React.FC<PermanentDeleteModalProps> = ({
  isOpen,
  photos,
  onConfirm,
  onClose,
  isProcessing = false,
}) => {
  if (!isOpen || photos.length === 0) return null;

  const totalSize = photos.reduce((acc, p) => acc + (p.size || 0), 0);
  const isMultiple = photos.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-rose-500/30 p-5 shadow-2xl text-slate-100 space-y-4">
        {/* Header Icon */}
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text */}
        <div>
          <h3 className="text-base font-bold text-slate-100">
            {isMultiple
              ? `Permanently Delete ${photos.length} Photos?`
              : 'Permanently Delete Image?'}
          </h3>
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
            This will completely remove {isMultiple ? 'these photos' : `"${photos[0].name}"`} from
            your device&apos;s offline memory. This action cannot be reversed.
          </p>
        </div>

        {/* Preview Strip */}
        <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
          <div className="flex -space-x-3 overflow-hidden shrink-0">
            {photos.slice(0, 3).map((p) => (
              <img
                key={p.id}
                src={p.thumbnailUrl || p.dataUrl}
                alt={p.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-slate-900 shadow-sm"
              />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate text-slate-200">
              {isMultiple ? `${photos.length} items selected` : photos[0].name}
            </p>
            <p className="text-[11px] text-rose-400 font-mono-numbers mt-0.5">
              Reclaiming {formatBytes(totalSize)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs active:scale-98 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-98 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Deleting...' : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
