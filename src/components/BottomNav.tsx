import React from 'react';
import { Image as ImageIcon, Folder, Crop, Trash2 } from 'lucide-react';
import { GalleryTab } from '../types/gallery';

interface BottomNavProps {
  currentTab: GalleryTab;
  onTabChange: (tab: GalleryTab) => void;
  trashCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  trashCount,
}) => {
  const tabs: { id: GalleryTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'albums', label: 'Albums', icon: Folder },
    { id: 'editor', label: 'Crop Studio', icon: Crop },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 items-center px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative min-h-[44px] flex flex-col items-center justify-center py-1 transition-all active:scale-95 group"
            >
              {/* Active pill background effect (Material 3 style) */}
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-sky-500/15 text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />

                {/* Badge for trash items */}
                {tab.id === 'trash' && trashCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center font-mono-numbers shadow-sm">
                    {trashCount}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] font-medium tracking-tight mt-0.5 transition-colors ${
                  isActive ? 'text-sky-400 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
