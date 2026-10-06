import React from 'react';
import { Folder, Heart, Camera, Crop, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Photo } from '../types/gallery';

interface AlbumsViewProps {
  photos: Photo[];
  onSelectAlbum: (albumName: string) => void;
}

export const AlbumsView: React.FC<AlbumsViewProps> = ({ photos, onSelectAlbum }) => {
  // Compute album statistics
  const cameraPhotos = photos.filter((p) => p.album === 'Camera' || !p.album);
  const editsPhotos = photos.filter((p) => p.album === 'Edits');
  const favPhotos = photos.filter((p) => p.isFavorite);
  const naturePhotos = photos.filter((p) => p.album === 'Nature');
  const wallpaperPhotos = photos.filter((p) => p.album === 'Wallpapers');

  // Discover any custom user albums
  const customAlbums = Array.from(
    new Set(
      photos
        .map((p) => p.album)
        .filter((a) => a && !['Camera', 'Edits', 'Nature', 'Wallpapers'].includes(a))
    )
  );

  const albumList = [
    {
      name: 'All Photos',
      count: photos.length,
      cover: photos[0]?.thumbnailUrl || photos[0]?.dataUrl,
      icon: ImageIcon,
      color: 'text-sky-400',
    },
    {
      name: 'Favorites',
      count: favPhotos.length,
      cover: favPhotos[0]?.thumbnailUrl || favPhotos[0]?.dataUrl,
      icon: Heart,
      color: 'text-rose-400',
    },
    {
      name: 'Camera',
      count: cameraPhotos.length,
      cover: cameraPhotos[0]?.thumbnailUrl || cameraPhotos[0]?.dataUrl,
      icon: Camera,
      color: 'text-amber-400',
    },
    {
      name: 'Edits & Cropped',
      count: editsPhotos.length,
      cover: editsPhotos[0]?.thumbnailUrl || editsPhotos[0]?.dataUrl,
      icon: Crop,
      color: 'text-emerald-400',
    },
    {
      name: 'Nature',
      count: naturePhotos.length,
      cover: naturePhotos[0]?.thumbnailUrl || naturePhotos[0]?.dataUrl,
      icon: Sparkles,
      color: 'text-teal-400',
    },
    {
      name: 'Wallpapers',
      count: wallpaperPhotos.length,
      cover: wallpaperPhotos[0]?.thumbnailUrl || wallpaperPhotos[0]?.dataUrl,
      icon: Folder,
      color: 'text-indigo-400',
    },
  ];

  // Append custom albums
  customAlbums.forEach((customName) => {
    const list = photos.filter((p) => p.album === customName);
    albumList.push({
      name: customName,
      count: list.length,
      cover: list[0]?.thumbnailUrl || list[0]?.dataUrl,
      icon: Folder,
      color: 'text-purple-400',
    });
  });

  return (
    <div className="flex-1 p-4 max-w-5xl mx-auto w-full pb-28">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-100">Photo Albums</h2>
        <p className="text-xs text-slate-400">Organized collections stored locally on your device.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {albumList.map((album) => {
          const IconComponent = album.icon;
          return (
            <div
              key={album.name}
              onClick={() => onSelectAlbum(album.name)}
              className="group cursor-pointer rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 overflow-hidden transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-xl"
            >
              {/* Cover Image Container */}
              <div className="aspect-square relative overflow-hidden bg-slate-950">
                {album.cover ? (
                  <img
                    src={album.cover}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-950">
                    <IconComponent className="w-10 h-10 stroke-1" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                {/* Badge Icon */}
                <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/50 backdrop-blur-md flex items-center justify-center">
                  <IconComponent className={`w-3.5 h-3.5 ${album.color}`} />
                </div>

                {/* Bottom title on card */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <p className="text-xs font-bold text-white truncate drop-shadow-sm">{album.name}</p>
                  <p className="text-[10px] text-slate-300 font-mono-numbers">
                    {album.count} {album.count === 1 ? 'photo' : 'photos'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
