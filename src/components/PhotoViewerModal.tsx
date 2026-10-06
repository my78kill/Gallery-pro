import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Crop,
  Share2,
  Download,
  Trash2,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Folder,
} from 'lucide-react';
import { Photo } from '../types/gallery';
import { formatBytes, formatFullDateTime, downloadDataUrl } from '../utils/imageUtils';

interface PhotoViewerModalProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onToggleFavorite: (id: string) => Promise<void>;
  onOpenCropper: (photo: Photo) => void;
  onRequestDelete: (photo: Photo) => void;
  onRequestPermanentDelete: (photo: Photo) => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onToggleFavorite,
  onOpenCropper,
  onRequestDelete,
  onRequestPermanentDelete,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const currentPhoto = photos[currentIndex];

  // Reset zoom on photo change
  useEffect(() => {
    setZoomLevel(1);
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, photos.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Touch swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    setTouchStart(null);
  };

  const handleShare = async () => {
    if (!currentPhoto) return;
    try {
      if (navigator.share) {
        // Create a blob file if possible
        const res = await fetch(currentPhoto.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], currentPhoto.name, { type: currentPhoto.mimeType });
        await navigator.share({
          title: currentPhoto.name,
          files: [file],
        });
      } else {
        downloadDataUrl(currentPhoto.dataUrl, currentPhoto.name);
      }
    } catch {
      downloadDataUrl(currentPhoto.dataUrl, currentPhoto.name);
    }
  };

  const handleDownload = () => {
    if (!currentPhoto) return;
    downloadDataUrl(currentPhoto.dataUrl, currentPhoto.name);
  };

  if (!isOpen || !currentPhoto) return null;

  const megapixels =
    currentPhoto.width && currentPhoto.height
      ? ((currentPhoto.width * currentPhoto.height) / 1000000).toFixed(1)
      : '0';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-slate-100 select-none overflow-hidden animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 hover:bg-white/10 active:scale-95 transition-all text-white"
            title="Back to gallery"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="max-w-[180px] sm:max-w-xs truncate">
            <h2 className="text-sm font-semibold truncate">{currentPhoto.name}</h2>
            <p className="text-[11px] text-slate-400">
              {currentIndex + 1} of {photos.length}
            </p>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowInfo((prev) => !prev)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              showInfo ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-black/40 text-slate-200 hover:bg-white/10'
            }`}
            title="Photo Information"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleFavorite(currentPhoto.id)}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-black/40 text-slate-200 hover:bg-white/10 transition-all"
            title="Toggle Favorite"
          >
            <Heart
              className={`w-4 h-4 ${
                currentPhoto.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-3 z-30 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all"
            title="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {currentIndex < photos.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-3 z-30 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all"
            title="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Photo Viewport */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={currentPhoto.dataUrl}
            alt={currentPhoto.name}
            className="max-w-[96vw] max-h-[76vh] object-contain select-none shadow-2xl"
          />
        </div>

        {/* Floating Zoom Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
          <button
            onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
            disabled={zoomLevel <= 1}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono-numbers px-1 text-slate-300">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
            disabled={zoomLevel >= 3}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slide-up Photo Details Sheet */}
      {showInfo && (
        <div className="bg-slate-900 border-t border-slate-800 p-4 animate-slideUp text-xs z-30">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-200">Details & Metadata</span>
            <button
              onClick={() => setShowInfo(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
            <div>
              <p className="text-slate-500 text-[10px]">Dimensions</p>
              <p className="font-mono-numbers font-medium text-slate-200">
                {currentPhoto.width} × {currentPhoto.height} ({megapixels} MP)
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px]">File Size</p>
              <p className="font-mono-numbers font-medium text-slate-200">
                {formatBytes(currentPhoto.size)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px]">Date Taken</p>
              <p className="font-medium text-slate-200">
                {formatFullDateTime(currentPhoto.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px]">Album</p>
              <p className="font-medium text-slate-200 flex items-center gap-1">
                <Folder className="w-3 h-3 text-sky-400" />
                <span>{currentPhoto.album || 'Camera'}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Android Action Bar */}
      <div className="flex items-center justify-around px-2 py-3 bg-gradient-to-t from-black via-black/90 to-transparent border-t border-white/5 pb-safe z-20">
        {/* Crop / Edit Button */}
        <button
          onClick={() => onOpenCropper(currentPhoto)}
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-sky-400 active:scale-95 transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <Crop className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium">Crop & Edit</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-sky-400 active:scale-95 transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <Share2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium">Share</span>
        </button>

        {/* Download to Device */}
        <button
          onClick={handleDownload}
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-sky-400 active:scale-95 transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <Download className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium">Save to Phone</span>
        </button>

        {/* Move to Trash */}
        <button
          onClick={() => onRequestDelete(currentPhoto)}
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-amber-400 active:scale-95 transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[10px] font-medium">Move to Bin</span>
        </button>

        {/* Permanent Delete Button */}
        <button
          onClick={() => onRequestPermanentDelete(currentPhoto)}
          className="flex flex-col items-center gap-1 text-rose-400 hover:text-rose-300 active:scale-95 transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-[10px] font-medium text-rose-400">Delete Perm.</span>
        </button>
      </div>
    </div>
  );
};
