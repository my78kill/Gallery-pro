import React from 'react';
import {
  Heart,
  CheckCircle2,
  Circle,
  Trash2,
  Download,
  Share2,
  Plus,
  Camera,
  Grid3X3,
  Grid2X2,
  LayoutGrid,
} from 'lucide-react';
import { Photo, GridViewMode } from '../types/gallery';
import { formatGalleryDate, formatBytes, downloadDataUrl } from '../utils/imageUtils';

interface PhotoGridViewProps {
  photos: Photo[];
  activeAlbum: string;
  onClearAlbumFilter: () => void;
  onOpenPhoto: (photo: Photo, index: number) => void;
  isSelectionMode: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onCancelSelection: () => void;
  onBatchMoveToTrash: (ids: string[]) => void;
  onBatchDeletePermanently: (photos: Photo[]) => void;
  onBatchToggleFavorite: (ids: string[]) => void;
  gridMode: GridViewMode;
  onChangeGridMode: (mode: GridViewMode) => void;
  onTriggerUpload: () => void;
  onTriggerCamera: () => void;
}

export const PhotoGridView: React.FC<PhotoGridViewProps> = ({
  photos,
  activeAlbum,
  onClearAlbumFilter,
  onOpenPhoto,
  isSelectionMode,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onCancelSelection,
  onBatchMoveToTrash,
  onBatchDeletePermanently,
  onBatchToggleFavorite,
  gridMode,
  onChangeGridMode,
  onTriggerUpload,
  onTriggerCamera,
}) => {
  // Group photos by date string
  const groupedPhotos = React.useMemo(() => {
    const groups: { [key: string]: Photo[] } = {};
    for (const p of photos) {
      const key = formatGalleryDate(p.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return groups;
  }, [photos]);

  const selectedPhotos = photos.filter((p) => selectedIds.includes(p.id));

  // Determine grid column class
  const gridClass =
    gridMode === 'compact'
      ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5'
      : gridMode === 'large'
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2';

  const handleBatchDownload = () => {
    selectedPhotos.forEach((photo) => {
      downloadDataUrl(photo.dataUrl, photo.name);
    });
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-3 sm:p-4 pb-28">
      {/* Active Album Filter Chip Bar */}
      {activeAlbum !== 'All Photos' && (
        <div className="mb-4 flex items-center justify-between p-2.5 px-3.5 rounded-2xl bg-sky-500/10 border border-sky-400/30 text-sky-300">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span>Album: {activeAlbum}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-numbers">{photos.length} photos</span>
          </div>
          <button
            onClick={onClearAlbumFilter}
            className="text-xs text-sky-400 hover:text-white underline"
          >
            Show All
          </button>
        </div>
      )}

      {/* Grid Size & View Bar (when not in multi-select mode) */}
      {!isSelectionMode && photos.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1 text-xs text-slate-400">
          <span className="font-mono-numbers font-medium">
            {photos.length} {photos.length === 1 ? 'item' : 'items'}
          </span>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => onChangeGridMode('compact')}
              className={`p-1.5 rounded-lg transition-colors ${
                gridMode === 'compact' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Compact Grid"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeGridMode('standard')}
              className={`p-1.5 rounded-lg transition-colors ${
                gridMode === 'standard' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Standard Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeGridMode('large')}
              className={`p-1.5 rounded-lg transition-colors ${
                gridMode === 'large' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Large View"
            >
              <Grid2X2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Batch Selection Action Floating Bar */}
      {isSelectionMode && (
        <div className="sticky top-16 z-30 mb-4 p-3 rounded-2xl bg-slate-850 bg-slate-900 border border-sky-500/40 shadow-xl flex items-center justify-between animate-slideUp">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancelSelection}
              className="text-xs text-slate-400 hover:text-white font-medium"
            >
              Cancel
            </button>
            <span className="text-xs font-bold text-sky-400 font-mono-numbers">
              {selectedIds.length} Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onBatchToggleFavorite(selectedIds)}
              disabled={selectedIds.length === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 disabled:opacity-40"
              title="Favorite Selected"
            >
              <Heart className="w-4 h-4" />
            </button>

            <button
              onClick={handleBatchDownload}
              disabled={selectedIds.length === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
              title="Save Selected to Device"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => onBatchMoveToTrash(selectedIds)}
              disabled={selectedIds.length === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 disabled:opacity-40"
              title="Move to Bin"
            >
              <Trash2 className="w-4 h-4 text-amber-400" />
            </button>

            <button
              onClick={() => onBatchDeletePermanently(selectedPhotos)}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 shadow-md shadow-rose-600/30"
              title="Permanently Delete Selected Photos"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete Perm.</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No photos in this view</h3>
          <p className="text-xs text-slate-500 max-w-xs mt-1 mb-5">
            Import images from your device or take a new picture with the camera. All data is kept 100% offline.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onTriggerUpload}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Import Device Photos</span>
            </button>
            <button
              onClick={onTriggerCamera}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 active:scale-95 transition-all border border-slate-700"
            >
              <Camera className="w-4 h-4" />
              <span>Open Camera</span>
            </button>
          </div>
        </div>
      )}

      {/* Date Grouped Photos List */}
      <div className="space-y-6">
        {Object.entries(groupedPhotos).map(([dateLabel, groupList]) => (
          <div key={dateLabel}>
            {/* Date Section Header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {dateLabel}
              </h3>
              <span className="text-[11px] text-slate-500 font-mono-numbers">
                {groupList.length}
              </span>
            </div>

            {/* Photo Grid */}
            <div className={`grid ${gridClass}`}>
              {groupList.map((photo, localIndex) => {
                const globalIndex = photos.findIndex((p) => p.id === photo.id);
                const isSelected = selectedIds.includes(photo.id);

                return (
                  <div
                    key={photo.id}
                    onClick={() => {
                      if (isSelectionMode) {
                        onToggleSelect(photo.id);
                      } else {
                        onOpenPhoto(photo, globalIndex);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      onToggleSelect(photo.id);
                    }}
                    className={`group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border cursor-pointer select-none transition-all duration-150 active:scale-[0.97] ${
                      isSelected
                        ? 'border-sky-400 ring-2 ring-sky-400 shadow-md shadow-sky-400/20'
                        : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={photo.thumbnailUrl || photo.dataUrl}
                      alt={photo.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Gradient overlay for bottom metadata */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Select Checkbox (always visible if in selection mode, visible on hover otherwise) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(photo.id);
                      }}
                      className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isSelectionMode || isSelected
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100 bg-black/50 backdrop-blur-sm'
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-sky-400 fill-sky-400/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-white/80" />
                      )}
                    </button>

                    {/* Favorite Heart Badge */}
                    {photo.isFavorite && (
                      <div className="absolute bottom-2 right-2 z-10 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      </div>
                    )}

                    {/* Album / Crop Pill */}
                    {photo.album === 'Edits' && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-emerald-500/80 text-[9px] font-bold text-slate-950 backdrop-blur-sm">
                        Edited
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
