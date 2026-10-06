import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, CheckSquare, Square, HardDrive } from 'lucide-react';
import { Photo, StorageStats } from '../types/gallery';
import { formatBytes, formatGalleryDate } from '../utils/imageUtils';

interface TrashViewProps {
  trashedPhotos: Photo[];
  stats: StorageStats;
  onRestore: (id: string) => Promise<void>;
  onBatchRestore: (ids: string[]) => Promise<void>;
  onPermanentDelete: (photo: Photo) => void;
  onBatchPermanentDelete: (photos: Photo[]) => void;
  onEmptyTrash: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({
  trashedPhotos,
  stats,
  onRestore,
  onBatchRestore,
  onPermanentDelete,
  onBatchPermanentDelete,
  onEmptyTrash,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === trashedPhotos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(trashedPhotos.map((p) => p.id));
    }
  };

  const selectedPhotos = trashedPhotos.filter((p) => selectedIds.includes(p.id));
  const trashedTotalBytes = trashedPhotos.reduce((acc, p) => acc + (p.size || 0), 0);

  return (
    <div className="flex-1 flex flex-col p-4 max-w-5xl mx-auto w-full pb-28">
      {/* Storage and Cleanup Hero Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 mb-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Trash & Device Storage</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage deleted photos. Permanently delete them to reclaim offline device storage.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  Total Gallery Memory: <strong className="font-mono-numbers text-slate-200">{formatBytes(stats.totalSizeBytes)}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  In Trash: <strong className="font-mono-numbers text-rose-400">{formatBytes(trashedTotalBytes)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {trashedPhotos.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={onEmptyTrash}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Trash</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selected batch bar if multi-selection */}
      {selectedIds.length > 0 && (
        <div className="sticky top-16 z-30 mb-4 p-3 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span>{selectedIds.length} item(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onBatchRestore(selectedIds);
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Restore</span>
            </button>
            <button
              onClick={() => {
                onBatchPermanentDelete(selectedPhotos);
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/30 active:scale-95 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Permanently</span>
            </button>
          </div>
        </div>
      )}

      {/* Header with Selection Controls */}
      {trashedPhotos.length > 0 && (
        <div className="flex items-center justify-between px-1 mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {trashedPhotos.length} {trashedPhotos.length === 1 ? 'Photo' : 'Photos'} in Trash
          </span>
          <button
            onClick={selectAll}
            className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium"
          >
            {selectedIds.length === trashedPhotos.length ? (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>Select All</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Grid of Trashed Items */}
      {trashedPhotos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
            <Trash2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-300">Trash is Empty</h3>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Photos moved to trash appear here. You can restore them or delete them permanently from your device.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {trashedPhotos.map((photo) => {
            const isSelected = selectedIds.includes(photo.id);
            return (
              <div
                key={photo.id}
                className={`group relative rounded-2xl overflow-hidden bg-slate-900 border transition-all ${
                  isSelected
                    ? 'border-rose-500 shadow-md shadow-rose-500/20 ring-2 ring-rose-500/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Photo Aspect Preview */}
                <div className="aspect-square relative overflow-hidden bg-slate-950">
                  <img
                    src={photo.thumbnailUrl || photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                  />

                  {/* Selection Checkbox */}
                  <button
                    onClick={() => toggleSelect(photo.id)}
                    className="absolute top-2 left-2 z-10 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                    ) : (
                      <Square className="w-4 h-4 text-white/70" />
                    )}
                  </button>

                  {/* Trashed badge */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-slate-300 font-mono-numbers">
                    {formatBytes(photo.size)}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-2.5 flex items-center justify-between gap-1 bg-slate-900">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 truncate">{photo.name}</p>
                    <p className="text-[10px] text-slate-500">
                      Deleted {formatGalleryDate(photo.deletedAt || photo.modifiedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onRestore(photo.id)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 flex items-center justify-center active:scale-95 transition-all"
                      title="Restore to Gallery"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onPermanentDelete(photo)}
                      className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 flex items-center justify-center active:scale-95 transition-all border border-rose-500/30"
                      title="Delete Permanently from Device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
