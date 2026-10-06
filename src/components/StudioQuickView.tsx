import React, { useRef } from 'react';
import { Crop, Upload, Sparkles, SlidersHorizontal, ImagePlus } from 'lucide-react';
import { Photo } from '../types/gallery';
import { formatBytes } from '../utils/imageUtils';

interface StudioQuickViewProps {
  photos: Photo[];
  onSelectPhotoToCrop: (photo: Photo) => void;
  onImportAndCrop: (files: FileList) => void;
}

export const StudioQuickView: React.FC<StudioQuickViewProps> = ({
  photos,
  onSelectPhotoToCrop,
  onImportAndCrop,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportAndCrop(e.target.files);
    }
  };

  return (
    <div className="flex-1 p-4 max-w-5xl mx-auto w-full pb-28">
      {/* Studio Header */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 mb-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shrink-0">
              <Crop className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Crop & Editing Studio</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Easily crop to standard aspect ratios (1:1, 16:9, 9:16 Story, 4:3), rotate 90°, adjust warmth/contrast, and save back to your offline device.
              </p>
            </div>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
            >
              <ImagePlus className="w-4 h-4" />
              <span>Import & Crop Image</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>1:1 Square & 9:16 Wallpapers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Rule of Thirds Grid</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Save Copy or Overwrite</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>100% Offline Device Canvas</span>
          </div>
        </div>
      </div>

      {/* Select Photo from Gallery to Crop */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Choose a Photo to Crop & Edit
          </h3>
          <span className="text-xs text-slate-500 font-mono-numbers">
            {photos.length} Available
          </span>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No photos yet. Import photos above to start cropping!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => onSelectPhotoToCrop(photo)}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-sky-400 cursor-pointer transition-all active:scale-98 shadow-md"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-950">
                  <img
                    src={photo.thumbnailUrl || photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="px-3 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                      <Crop className="w-3.5 h-3.5" />
                      <span>Open Cropper</span>
                    </div>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-900">
                  <p className="text-xs font-medium text-slate-200 truncate">{photo.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono-numbers">
                    {photo.width} × {photo.height} · {formatBytes(photo.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
