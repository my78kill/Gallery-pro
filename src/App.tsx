import React, { useState, useEffect, useRef, useMemo } from 'react';
import { storage } from './services/storage';
import { Photo, GalleryTab, GridViewMode, StorageStats } from './types/gallery';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { PhotoGridView } from './components/PhotoGridView';
import { AlbumsView } from './components/AlbumsView';
import { StudioQuickView } from './components/StudioQuickView';
import { TrashView } from './components/TrashView';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { ImageCropperModal } from './components/ImageCropperModal';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { PermanentDeleteModal } from './components/PermanentDeleteModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Plus, Camera, Check, AlertCircle } from 'lucide-react';

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [trashedPhotos, setTrashedPhotos] = useState<Photo[]>([]);
  const [stats, setStats] = useState<StorageStats>({
    totalPhotos: 0,
    trashCount: 0,
    favoritesCount: 0,
    totalSizeBytes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Navigation & View states
  const [currentTab, setCurrentTab] = useState<GalleryTab>('photos');
  const [activeAlbum, setActiveAlbum] = useState<string>('All Photos');
  const [searchQuery, setSearchQuery] = useState('');
  const [gridMode, setGridMode] = useState<GridViewMode>('standard');

  // Selection states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [activeViewerIndex, setActiveViewerIndex] = useState<number | null>(null);
  const [activeCropperPhoto, setActiveCropperPhoto] = useState<Photo | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [permanentDeleteState, setPermanentDeleteState] = useState<{
    isOpen: boolean;
    photos: Photo[];
  }>({
    isOpen: false,
    photos: [],
  });

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data from offline IndexedDB
  const refreshGallery = async () => {
    try {
      const [active, trashed, currentStats] = await Promise.all([
        storage.getAllActivePhotos(),
        storage.getTrashedPhotos(),
        storage.getStorageStats(),
      ]);
      setPhotos(active);
      setTrashedPhotos(trashed);
      setStats(currentStats);
    } catch (err) {
      console.error('Error refreshing gallery data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await storage.init();
      await refreshGallery();
    };
    init();
  }, []);

  // Filter photos based on album & search
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      // Album filter
      if (activeAlbum === 'Favorites') {
        if (!photo.isFavorite) return false;
      } else if (activeAlbum !== 'All Photos') {
        if (photo.album !== activeAlbum) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = photo.name.toLowerCase().includes(q);
        const matchesAlbum = photo.album?.toLowerCase().includes(q);
        if (!matchesName && !matchesAlbum) return false;
      }

      return true;
    });
  }, [photos, activeAlbum, searchQuery]);

  // Import device files
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const imported = await storage.importLocalFiles(files, 'Camera');
      await refreshGallery();
      showToast(`Imported ${imported.length} image(s) to device gallery`);
    } catch (err) {
      console.error('Failed to import files:', err);
      showToast('Error importing files', 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Camera capture handler
  const handleCameraCapture = async (dataUrl: string, blob: Blob) => {
    try {
      const file = new File([blob], `IMG_CAM_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const imported = await storage.importLocalFiles([file], 'Camera');
      await refreshGallery();
      showToast('Photo captured and saved to offline gallery');
    } catch (err) {
      console.error('Failed to save captured photo:', err);
      showToast('Failed to save camera photo', 'error');
    }
  };

  // Favorite toggle
  const handleToggleFavorite = async (id: string) => {
    try {
      const isFav = await storage.toggleFavorite(id);
      await refreshGallery();
      showToast(isFav ? 'Added to Favorites' : 'Removed from Favorites', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Move to trash
  const handleMoveToTrash = async (photo: Photo) => {
    try {
      await storage.moveToTrash(photo.id);
      await refreshGallery();
      setActiveViewerIndex(null);
      showToast(`"${photo.name}" moved to Trash`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchMoveToTrash = async (ids: string[]) => {
    try {
      await storage.batchMoveToTrash(ids);
      await refreshGallery();
      setSelectedIds([]);
      setIsSelectionMode(false);
      showToast(`Moved ${ids.length} photo(s) to Trash`);
    } catch (err) {
      console.error(err);
    }
  };

  // Restore from trash
  const handleRestore = async (id: string) => {
    try {
      await storage.restoreFromTrash(id);
      await refreshGallery();
      showToast('Photo restored to gallery');
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchRestore = async (ids: string[]) => {
    try {
      await storage.batchRestore(ids);
      await refreshGallery();
      showToast(`Restored ${ids.length} photo(s) to gallery`);
    } catch (err) {
      console.error(err);
    }
  };

  // Permanent Deletion handlers
  const openPermanentDeleteModal = (targetPhotos: Photo[]) => {
    setPermanentDeleteState({
      isOpen: true,
      photos: targetPhotos,
    });
  };

  const handleConfirmPermanentDelete = async () => {
    const targetPhotos = permanentDeleteState.photos;
    if (targetPhotos.length === 0) return;

    try {
      const ids = targetPhotos.map((p) => p.id);
      await storage.batchDeletePermanently(ids);
      await refreshGallery();
      setPermanentDeleteState({ isOpen: false, photos: [] });
      setSelectedIds([]);
      setIsSelectionMode(false);
      if (activeViewerIndex !== null) {
        setActiveViewerIndex(null);
      }
      showToast(`Permanently deleted ${targetPhotos.length} photo(s) from device`);
    } catch (err) {
      console.error('Failed to permanently delete:', err);
      showToast('Failed to delete photos permanently', 'error');
    }
  };

  const handleEmptyTrash = () => {
    if (trashedPhotos.length === 0) return;
    openPermanentDeleteModal(trashedPhotos);
  };

  // Cropper Save handlers
  const handleSaveCroppedCopy = async (croppedData: {
    dataUrl: string;
    width: number;
    height: number;
    size: number;
  }) => {
    if (!activeCropperPhoto) return;
    const now = Date.now();
    const originalName = activeCropperPhoto.name.replace(/\.[^/.]+$/, '');
    const ext = activeCropperPhoto.mimeType.includes('png') ? 'png' : 'jpg';

    const newPhoto: Photo = {
      id: `crop_${now}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${originalName}_cropped.${ext}`,
      dataUrl: croppedData.dataUrl,
      thumbnailUrl: croppedData.dataUrl,
      width: croppedData.width,
      height: croppedData.height,
      size: croppedData.size,
      mimeType: activeCropperPhoto.mimeType,
      createdAt: now,
      modifiedAt: now,
      isFavorite: false,
      album: 'Edits',
      isDeleted: false,
      deletedAt: null,
      aspectRatio: `${croppedData.width}:${croppedData.height}`,
    };

    await storage.savePhoto(newPhoto);
    await refreshGallery();
    showToast('Cropped copy saved to "Edits" album');
  };

  const handleOverwriteCropped = async (croppedData: {
    dataUrl: string;
    width: number;
    height: number;
    size: number;
  }) => {
    if (!activeCropperPhoto) return;

    const updatedPhoto: Photo = {
      ...activeCropperPhoto,
      dataUrl: croppedData.dataUrl,
      thumbnailUrl: croppedData.dataUrl,
      width: croppedData.width,
      height: croppedData.height,
      size: croppedData.size,
      modifiedAt: Date.now(),
      album: activeCropperPhoto.album === 'Camera' ? 'Edits' : activeCropperPhoto.album,
    };

    await storage.savePhoto(updatedPhoto);
    await refreshGallery();
    showToast('Original image updated with cropped version');
  };

  // Selection toggles
  const handleToggleSelect = (id: string) => {
    if (!isSelectionMode) setIsSelectionMode(true);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPhotos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPhotos.map((p) => p.id));
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const handleBatchToggleFavorite = async (ids: string[]) => {
    for (const id of ids) {
      await storage.toggleFavorite(id);
    }
    await refreshGallery();
    setSelectedIds([]);
    setIsSelectionMode(false);
    showToast(`Updated favorites for ${ids.length} photo(s)`);
  };

  // Album selection
  const handleSelectAlbum = (albumName: string) => {
    setActiveAlbum(albumName);
    setCurrentTab('photos');
  };

  const handleImportAndCrop = async (files: FileList) => {
    const imported = await storage.importLocalFiles(files, 'Camera');
    await refreshGallery();
    if (imported[0]) {
      setActiveCropperPhoto(imported[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-slate-950 font-sans">
      {/* Hidden File Input for Device Photo Import */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Android Top App Bar */}
      <TopBar
        currentTab={currentTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onTriggerCamera={() => setIsCameraOpen(true)}
        onTriggerUpload={handleTriggerUpload}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={() => {
          setIsSelectionMode(!isSelectionMode);
          if (isSelectionMode) setSelectedIds([]);
        }}
        totalPhotosCount={photos.length}
      />

      {/* Main Content by Tab */}
      <main className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading offline gallery...</p>
            </div>
          </div>
        ) : (
          <>
            {currentTab === 'photos' && (
              <PhotoGridView
                photos={filteredPhotos}
                activeAlbum={activeAlbum}
                onClearAlbumFilter={() => setActiveAlbum('All Photos')}
                onOpenPhoto={(photo, index) => setActiveViewerIndex(index)}
                isSelectionMode={isSelectionMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onCancelSelection={handleCancelSelection}
                onBatchMoveToTrash={handleBatchMoveToTrash}
                onBatchDeletePermanently={(target) => openPermanentDeleteModal(target)}
                onBatchToggleFavorite={handleBatchToggleFavorite}
                gridMode={gridMode}
                onChangeGridMode={setGridMode}
                onTriggerUpload={handleTriggerUpload}
                onTriggerCamera={() => setIsCameraOpen(true)}
              />
            )}

            {currentTab === 'albums' && (
              <AlbumsView photos={photos} onSelectAlbum={handleSelectAlbum} />
            )}

            {currentTab === 'editor' && (
              <StudioQuickView
                photos={photos}
                onSelectPhotoToCrop={(photo) => setActiveCropperPhoto(photo)}
                onImportAndCrop={handleImportAndCrop}
              />
            )}

            {currentTab === 'trash' && (
              <TrashView
                trashedPhotos={trashedPhotos}
                stats={stats}
                onRestore={handleRestore}
                onBatchRestore={handleBatchRestore}
                onPermanentDelete={(photo) => openPermanentDeleteModal([photo])}
                onBatchPermanentDelete={(target) => openPermanentDeleteModal(target)}
                onEmptyTrash={handleEmptyTrash}
              />
            )}
          </>
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 mx-auto max-w-sm flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-slate-700 text-slate-100 text-xs font-medium shadow-2xl backdrop-blur-md animate-slideDown">
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Offline Status Pill */}
      <OfflineIndicator />

      {/* Android Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (isSelectionMode) {
            setIsSelectionMode(false);
            setSelectedIds([]);
          }
        }}
        trashCount={trashedPhotos.length}
      />

      {/* Photo Lightbox Viewer Modal */}
      {activeViewerIndex !== null && filteredPhotos[activeViewerIndex] && (
        <PhotoViewerModal
          photos={filteredPhotos}
          currentIndex={activeViewerIndex}
          isOpen={activeViewerIndex !== null}
          onClose={() => setActiveViewerIndex(null)}
          onNavigate={(newIdx) => setActiveViewerIndex(newIdx)}
          onToggleFavorite={handleToggleFavorite}
          onOpenCropper={(photo) => setActiveCropperPhoto(photo)}
          onRequestDelete={(photo) => handleMoveToTrash(photo)}
          onRequestPermanentDelete={(photo) => openPermanentDeleteModal([photo])}
        />
      )}

      {/* Image Cropper Modal */}
      {activeCropperPhoto && (
        <ImageCropperModal
          photo={activeCropperPhoto}
          isOpen={!!activeCropperPhoto}
          onClose={() => setActiveCropperPhoto(null)}
          onSaveCopy={handleSaveCroppedCopy}
          onOverwrite={handleOverwriteCropped}
        />
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Permanent Delete Confirmation Dialog */}
      <PermanentDeleteModal
        isOpen={permanentDeleteState.isOpen}
        photos={permanentDeleteState.photos}
        onConfirm={handleConfirmPermanentDelete}
        onClose={() => setPermanentDeleteState({ isOpen: false, photos: [] })}
      />
    </div>
  );
}
