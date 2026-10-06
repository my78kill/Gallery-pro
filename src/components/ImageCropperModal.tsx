import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Check,
  Copy,
  Sliders,
  Crop as CropIcon,
  Download,
  RotateCcw as ResetIcon,
  Maximize2,
  Square,
  Smartphone,
  Tv,
} from 'lucide-react';
import { Photo, AspectRatioPreset, CropRect, ImageAdjustments } from '../types/gallery';
import { processAndCropImage, downloadDataUrl } from '../utils/imageUtils';

interface ImageCropperModalProps {
  photo: Photo;
  isOpen: boolean;
  onClose: () => void;
  onSaveCopy: (croppedPhotoData: { dataUrl: string; width: number; height: number; size: number }) => Promise<void>;
  onOverwrite: (croppedPhotoData: { dataUrl: string; width: number; height: number; size: number }) => Promise<void>;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  photo,
  isOpen,
  onClose,
  onSaveCopy,
  onOverwrite,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [activeTab, setActiveTab] = useState<'crop' | 'adjust'>('crop');
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>('free');

  // Crop rect represented as percentages (0 to 100)
  const [crop, setCrop] = useState<CropRect>({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });

  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 0,
    sepia: 0,
    grayscale: 0,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null); // 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'
  const dragStartRef = useRef<{ startX: number; startY: number; initialCrop: CropRect }>({
    startX: 0,
    startY: 0,
    initialCrop: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Reset when a new photo is loaded
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 5, y: 5, width: 90, height: 90 });
      setAdjustments({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        warmth: 0,
        sepia: 0,
        grayscale: 0,
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      });
      setAspectPreset('free');
      setActiveTab('crop');
    }
  }, [isOpen, photo.id]);

  // Handle aspect ratio constraint updates
  const applyAspectPreset = (preset: AspectRatioPreset) => {
    setAspectPreset(preset);
    if (!imgRef.current) return;

    if (preset === 'free') return;

    let targetRatio = 1;
    switch (preset) {
      case '1:1':
        targetRatio = 1;
        break;
      case '4:3':
        targetRatio = 4 / 3;
        break;
      case '16:9':
        targetRatio = 16 / 9;
        break;
      case '9:16':
        targetRatio = 9 / 16;
        break;
      case '3:2':
        targetRatio = 3 / 2;
        break;
      case '2:3':
        targetRatio = 2 / 3;
        break;
    }

    const img = imgRef.current;
    const imgRatio = (img.naturalWidth || 1) / (img.naturalHeight || 1);

    // Calculate percent dimensions based on ratios
    let newW = 80;
    let newH = (newW / targetRatio) * imgRatio;

    if (newH > 90) {
      newH = 90;
      newW = (newH * targetRatio) / imgRatio;
    }

    const newX = Math.max(0, (100 - newW) / 2);
    const newY = Math.max(0, (100 - newH) / 2);

    setCrop({
      x: newX,
      y: newY,
      width: Math.min(100 - newX, newW),
      height: Math.min(100 - newY, newH),
    });
  };

  // Dragging logic for crop boundaries
  const handlePointerDown = (handle: string, clientX: number, clientY: number) => {
    setIsDragging(handle);
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialCrop: { ...crop },
    };
  };

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((clientX - dragStartRef.current.startX) / rect.width) * 100;
      const deltaY = ((clientY - dragStartRef.current.startY) / rect.height) * 100;
      const init = dragStartRef.current.initialCrop;

      let nextX = init.x;
      let nextY = init.y;
      let nextW = init.width;
      let nextH = init.height;

      const minSize = 10; // 10% minimum size

      if (isDragging === 'move') {
        nextX = Math.max(0, Math.min(100 - init.width, init.x + deltaX));
        nextY = Math.max(0, Math.min(100 - init.height, init.y + deltaY));
      } else {
        if (isDragging.includes('e')) {
          nextW = Math.max(minSize, Math.min(100 - init.x, init.width + deltaX));
        }
        if (isDragging.includes('s')) {
          nextH = Math.max(minSize, Math.min(100 - init.y, init.height + deltaY));
        }
        if (isDragging.includes('w')) {
          const maxDeltaLeft = init.width - minSize;
          const clampDeltaX = Math.max(-init.x, Math.min(maxDeltaLeft, deltaX));
          nextX = init.x + clampDeltaX;
          nextW = init.width - clampDeltaX;
        }
        if (isDragging.includes('n')) {
          const maxDeltaTop = init.height - minSize;
          const clampDeltaY = Math.max(-init.y, Math.min(maxDeltaTop, deltaY));
          nextY = init.y + clampDeltaY;
          nextH = init.height - clampDeltaY;
        }

        // Apply aspect ratio constraint if not free
        if (aspectPreset !== 'free' && imgRef.current) {
          const img = imgRef.current;
          const imgRatio = (img.naturalWidth || 1) / (img.naturalHeight || 1);
          let targetRatio = 1;
          if (aspectPreset === '4:3') targetRatio = 4 / 3;
          if (aspectPreset === '16:9') targetRatio = 16 / 9;
          if (aspectPreset === '9:16') targetRatio = 9 / 16;
          if (aspectPreset === '3:2') targetRatio = 3 / 2;
          if (aspectPreset === '2:3') targetRatio = 2 / 3;

          const requiredHeightPct = (nextW / targetRatio) * imgRatio;
          if (nextY + requiredHeightPct <= 100) {
            nextH = requiredHeightPct;
          }
        }
      }

      setCrop({
        x: Math.max(0, Math.min(100 - minSize, nextX)),
        y: Math.max(0, Math.min(100 - minSize, nextY)),
        width: Math.max(minSize, Math.min(100, nextW)),
        height: Math.max(minSize, Math.min(100, nextH)),
      });
    },
    [isDragging, aspectPreset]
  );

  const handlePointerUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handlePointerMove(e.clientX, e.clientY);
    };
    const onMouseUp = () => {
      if (isDragging) handlePointerUp();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => {
      if (isDragging) handlePointerUp();
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handlePointerMove]);

  // Rotations & Flips
  const rotateClockwise = () => {
    setAdjustments((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const rotateCounterClockwise = () => {
    setAdjustments((prev) => ({
      ...prev,
      rotation: (prev.rotation + 270) % 360,
    }));
  };

  const toggleFlipH = () => {
    setAdjustments((prev) => ({
      ...prev,
      flipHorizontal: !prev.flipHorizontal,
    }));
  };

  const toggleFlipV = () => {
    setAdjustments((prev) => ({
      ...prev,
      flipVertical: !prev.flipVertical,
    }));
  };

  const resetAll = () => {
    setCrop({ x: 5, y: 5, width: 90, height: 90 });
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      warmth: 0,
      sepia: 0,
      grayscale: 0,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    });
    setAspectPreset('free');
  };

  // Perform render & save
  const handleSaveAsCopy = async () => {
    try {
      setIsProcessing(true);
      const result = await processAndCropImage(photo.dataUrl, crop, adjustments, photo.mimeType);
      await onSaveCopy(result);
      onClose();
    } catch (err) {
      console.error('Failed to crop image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOverwrite = async () => {
    try {
      setIsProcessing(true);
      const result = await processAndCropImage(photo.dataUrl, crop, adjustments, photo.mimeType);
      await onOverwrite(result);
      onClose();
    } catch (err) {
      console.error('Failed to crop image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadCropped = async () => {
    try {
      setIsProcessing(true);
      const result = await processAndCropImage(photo.dataUrl, crop, adjustments, photo.mimeType);
      const ext = photo.mimeType.includes('png') ? 'png' : 'jpg';
      const filename = photo.name.replace(/\.[^/.]+$/, '') + '_cropped.' + ext;
      downloadDataUrl(result.dataUrl, filename);
    } catch (err) {
      console.error('Failed to download cropped image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  // Filter style for preview image
  const previewFilter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) sepia(${adjustments.sepia}%) grayscale(${adjustments.grayscale}%)`;

  const previewTransform = `rotate(${adjustments.rotation}deg) scale(${adjustments.flipHorizontal ? -1 : 1}, ${adjustments.flipVertical ? -1 : 1})`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden animate-fadeIn">
      {/* Top Android App Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Crop & Enhance</h2>
            <p className="text-[11px] text-slate-400 font-mono-numbers">
              {photo.width} × {photo.height} px
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetAll}
            className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 flex items-center gap-1 active:scale-95 transition-all"
            title="Reset crop and adjustments"
          >
            <ResetIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleDownloadCropped}
            disabled={isProcessing}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1 active:scale-95 transition-all border border-slate-700"
            title="Download directly to device storage"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={handleSaveAsCopy}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition-all"
            title="Save as a new edited photo in gallery"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Save Copy</span>
          </button>

          <button
            onClick={handleOverwrite}
            disabled={isProcessing}
            className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs items-center gap-1.5 active:scale-95 transition-all"
            title="Overwrite original photo in storage"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Overwrite</span>
          </button>
        </div>
      </div>

      {/* Main Cropping Viewport */}
      <div className="relative flex-1 flex items-center justify-center p-4 bg-black/60 overflow-hidden">
        {/* Container for Image & Overlay */}
        <div
          ref={containerRef}
          className="relative max-w-full max-h-[60vh] sm:max-h-[70vh] flex items-center justify-center shadow-2xl"
          style={{ touchAction: 'none' }}
        >
          <img
            ref={imgRef}
            src={photo.dataUrl}
            alt={photo.name}
            className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain select-none pointer-events-none rounded-lg transition-transform duration-150"
            style={{
              filter: previewFilter,
              transform: previewTransform,
            }}
          />

          {/* Semi-transparent Dimmed Mask Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top mask */}
            <div
              className="absolute left-0 right-0 top-0 bg-black/65 transition-all duration-75"
              style={{ height: `${crop.y}%` }}
            />
            {/* Bottom mask */}
            <div
              className="absolute left-0 right-0 bottom-0 bg-black/65 transition-all duration-75"
              style={{ height: `${100 - (crop.y + crop.height)}%` }}
            />
            {/* Left mask */}
            <div
              className="absolute left-0 bg-black/65 transition-all duration-75"
              style={{
                top: `${crop.y}%`,
                height: `${crop.height}%`,
                width: `${crop.x}%`,
              }}
            />
            {/* Right mask */}
            <div
              className="absolute right-0 bg-black/65 transition-all duration-75"
              style={{
                top: `${crop.y}%`,
                height: `${crop.height}%`,
                width: `${100 - (crop.x + crop.width)}%`,
              }}
            />
          </div>

          {/* Crop Boundary Box */}
          <div
            className="absolute border-2 border-sky-400 cursor-move shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
            style={{
              left: `${crop.x}%`,
              top: `${crop.y}%`,
              width: `${crop.width}%`,
              height: `${crop.height}%`,
            }}
            onMouseDown={(e) => handlePointerDown('move', e.clientX, e.clientY)}
            onTouchStart={(e) => {
              if (e.touches[0]) handlePointerDown('move', e.touches[0].clientX, e.touches[0].clientY);
            }}
          >
            {/* Rule of Thirds Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-60">
              <div className="border-r border-sky-300/40 col-span-1 row-span-3 h-full" />
              <div className="border-r border-sky-300/40 col-span-1 row-span-3 h-full" />
              <div className="border-b border-sky-300/40 col-span-3 row-span-1 w-full absolute top-1/3 left-0" />
              <div className="border-b border-sky-300/40 col-span-3 row-span-1 w-full absolute top-2/3 left-0" />
            </div>

            {/* Corner Handles */}
            {/* NW */}
            <div
              className="absolute -top-2.5 -left-2.5 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-30"
              onMouseDown={(e) => {
                e.stopPropagation();
                handlePointerDown('nw', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches[0]) handlePointerDown('nw', e.touches[0].clientX, e.touches[0].clientY);
              }}
            >
              <div className="w-3.5 h-3.5 bg-sky-400 border-2 border-white rounded-full shadow" />
            </div>

            {/* NE */}
            <div
              className="absolute -top-2.5 -right-2.5 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-30"
              onMouseDown={(e) => {
                e.stopPropagation();
                handlePointerDown('ne', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches[0]) handlePointerDown('ne', e.touches[0].clientX, e.touches[0].clientY);
              }}
            >
              <div className="w-3.5 h-3.5 bg-sky-400 border-2 border-white rounded-full shadow" />
            </div>

            {/* SE */}
            <div
              className="absolute -bottom-2.5 -right-2.5 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-30"
              onMouseDown={(e) => {
                e.stopPropagation();
                handlePointerDown('se', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches[0]) handlePointerDown('se', e.touches[0].clientX, e.touches[0].clientY);
              }}
            >
              <div className="w-3.5 h-3.5 bg-sky-400 border-2 border-white rounded-full shadow" />
            </div>

            {/* SW */}
            <div
              className="absolute -bottom-2.5 -left-2.5 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-30"
              onMouseDown={(e) => {
                e.stopPropagation();
                handlePointerDown('sw', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches[0]) handlePointerDown('sw', e.touches[0].clientX, e.touches[0].clientY);
              }}
            >
              <div className="w-3.5 h-3.5 bg-sky-400 border-2 border-white rounded-full shadow" />
            </div>

            {/* Edge Midpoint Handles for easy touch dragging */}
            <div
              className="absolute top-1/2 -left-2 w-5 h-8 -translate-y-1/2 flex items-center justify-center cursor-ew-resize z-20"
              onMouseDown={(e) => {
                e.stopPropagation();
                handlePointerDown('w', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches[0]) handlePointerDown('w', e.touches[0].clientX, e.touches[0].clientY);
              }}
            >
              <div className="w-1.5 h-4 bg-white/90 rounded-full shadow" />
            </div>

            <div
              className="absolute top-1/2 -right-2 w-5 h-8 -translate-y-1/2 flex items-center justify-center cursor-ew-resize z-20"
              onMouseDown={(e) => {
                e.stopPropagation();
                handlePointerDown('e', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches[0]) handlePointerDown('e', e.touches[0].clientX, e.touches[0].clientY);
              }}
            >
              <div className="w-1.5 h-4 bg-white/90 rounded-full shadow" />
            </div>

            <div
              className="absolute -top-2 left-1/2 w-8 h-5 -translate-x-1/2 flex items-center justify-center cursor-ns-resize z-20"
              onMouseDown={(e) => {
                e.stopPropagation();
                handlePointerDown('n', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches[0]) handlePointerDown('n', e.touches[0].clientX, e.touches[0].clientY);
              }}
            >
              <div className="w-4 h-1.5 bg-white/90 rounded-full shadow" />
            </div>

            <div
              className="absolute -bottom-2 left-1/2 w-8 h-5 -translate-x-1/2 flex items-center justify-center cursor-ns-resize z-20"
              onMouseDown={(e) => {
                e.stopPropagation();
                handlePointerDown('s', e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches[0]) handlePointerDown('s', e.touches[0].clientX, e.touches[0].clientY);
              }}
            >
              <div className="w-4 h-1.5 bg-white/90 rounded-full shadow" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tool Bar / Tab Controller */}
      <div className="bg-slate-900 border-t border-slate-800 pb-safe">
        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-center gap-2 p-2 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('crop')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'crop'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CropIcon className="w-3.5 h-3.5" />
            <span>Aspect & Rotate</span>
          </button>
          <button
            onClick={() => setActiveTab('adjust')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'adjust'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Enhance & Filters</span>
          </button>
        </div>

        {/* Tab 1: Crop Presets & Rotation Controls */}
        {activeTab === 'crop' && (
          <div className="p-3 space-y-3">
            {/* Quick Orientation & Flip Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={rotateCounterClockwise}
                className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center active:scale-95 transition-all"
                title="Rotate 90° Left"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={rotateClockwise}
                className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center active:scale-95 transition-all"
                title="Rotate 90° Right"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFlipH}
                className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                  adjustments.flipHorizontal
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-400/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Flip Horizontal"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFlipV}
                className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                  adjustments.flipVertical
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-400/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Flip Vertical"
              >
                <FlipVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Horizontal Scrollable Aspect Ratio Presets */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-2 justify-start sm:justify-center">
              <button
                onClick={() => applyAspectPreset('free')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition-all ${
                  aspectPreset === 'free'
                    ? 'bg-white text-slate-900 font-semibold shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Freeform</span>
              </button>

              <button
                onClick={() => applyAspectPreset('1:1')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition-all ${
                  aspectPreset === '1:1'
                    ? 'bg-white text-slate-900 font-semibold shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>1:1 Square</span>
              </button>

              <button
                onClick={() => applyAspectPreset('4:3')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition-all ${
                  aspectPreset === '4:3'
                    ? 'bg-white text-slate-900 font-semibold shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>4:3 Standard</span>
              </button>

              <button
                onClick={() => applyAspectPreset('16:9')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition-all ${
                  aspectPreset === '16:9'
                    ? 'bg-white text-slate-900 font-semibold shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>16:9 Wide</span>
              </button>

              <button
                onClick={() => applyAspectPreset('9:16')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition-all ${
                  aspectPreset === '9:16'
                    ? 'bg-white text-slate-900 font-semibold shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16 Story</span>
              </button>

              <button
                onClick={() => applyAspectPreset('3:2')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition-all ${
                  aspectPreset === '3:2'
                    ? 'bg-white text-slate-900 font-semibold shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <span>3:2 Photo</span>
              </button>

              <button
                onClick={() => applyAspectPreset('2:3')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition-all ${
                  aspectPreset === '2:3'
                    ? 'bg-white text-slate-900 font-semibold shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <span>2:3 Portrait</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Sliders & Color Adjustments */}
        {activeTab === 'adjust' && (
          <div className="p-3 max-w-lg mx-auto grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
            {/* Brightness */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Brightness</span>
                <span className="font-mono-numbers">{adjustments.brightness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={adjustments.brightness}
                onChange={(e) =>
                  setAdjustments((prev) => ({ ...prev, brightness: Number(e.target.value) }))
                }
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Contrast</span>
                <span className="font-mono-numbers">{adjustments.contrast}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={adjustments.contrast}
                onChange={(e) =>
                  setAdjustments((prev) => ({ ...prev, contrast: Number(e.target.value) }))
                }
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Saturation</span>
                <span className="font-mono-numbers">{adjustments.saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={adjustments.saturation}
                onChange={(e) =>
                  setAdjustments((prev) => ({ ...prev, saturation: Number(e.target.value) }))
                }
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Warmth */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Warmth</span>
                <span className="font-mono-numbers">{adjustments.warmth}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={adjustments.warmth}
                onChange={(e) =>
                  setAdjustments((prev) => ({ ...prev, warmth: Number(e.target.value) }))
                }
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Grayscale */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>B&W Grayscale</span>
                <span className="font-mono-numbers">{adjustments.grayscale}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={adjustments.grayscale}
                onChange={(e) =>
                  setAdjustments((prev) => ({ ...prev, grayscale: Number(e.target.value) }))
                }
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Sepia Vintage */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Vintage Sepia</span>
                <span className="font-mono-numbers">{adjustments.sepia}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={adjustments.sepia}
                onChange={(e) =>
                  setAdjustments((prev) => ({ ...prev, sepia: Number(e.target.value) }))
                }
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
