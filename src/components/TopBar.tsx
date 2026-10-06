import React from 'react';
import { Camera, Plus, CheckSquare, Search, HardDrive } from 'lucide-react';
import { GalleryTab } from '../types/gallery';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  currentTab: GalleryTab;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onTriggerCamera: () => void;
  onTriggerUpload: () => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  totalPhotosCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  searchQuery,
  onSearchChange,
  onTriggerCamera,
  onTriggerUpload,
  isSelectionMode,
  onToggleSelectionMode,
  totalPhotosCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 pt-safe">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">
              Prism Gallery
            </h1>
            <span className="text-[10px] text-slate-400 leading-none">Offline Device</span>
          </div>
        </div>

        {/* Center: Search Field (visible in photos and albums tabs) */}
        {(currentTab === 'photos' || currentTab === 'albums') && (
          <div className="relative flex-1 max-w-xs hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search offline photos..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
            />
          </div>
        )}

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton />

          {currentTab === 'photos' && totalPhotosCount > 0 && (
            <button
              onClick={onToggleSelectionMode}
              className={`p-2 rounded-xl transition-all ${
                isSelectionMode
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
              title={isSelectionMode ? 'Exit Selection Mode' : 'Select Photos'}
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onTriggerCamera}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 active:scale-95 transition-all"
            title="Take Photo with Camera"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={onTriggerUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
            title="Import Photos from Device"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>
        </div>
      </div>
    </header>
  );
};
