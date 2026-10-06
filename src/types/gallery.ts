export interface Photo {
  id: string;
  name: string;
  dataUrl: string;
  thumbnailUrl: string;
  size: number; // in bytes
  width: number;
  height: number;
  mimeType: string;
  createdAt: number;
  modifiedAt: number;
  isFavorite: boolean;
  album: string;
  isDeleted: boolean;
  deletedAt: number | null;
  aspectRatio: string;
  dominantColor?: string;
}

export type AspectRatioPreset = 'free' | '1:1' | '4:3' | '16:9' | '9:16' | '3:2' | '2:3';

export interface CropRect {
  x: number; // percentage [0, 100]
  y: number; // percentage [0, 100]
  width: number; // percentage [0, 100]
  height: number; // percentage [0, 100]
}

export interface ImageAdjustments {
  brightness: number; // 50 to 150 (default 100)
  contrast: number; // 50 to 150 (default 100)
  saturation: number; // 0 to 200 (default 100)
  warmth: number; // -50 to 50 (default 0)
  sepia: number; // 0 to 100 (default 0)
  grayscale: number; // 0 to 100 (default 0)
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export type GalleryTab = 'photos' | 'albums' | 'editor' | 'trash';

export type GridViewMode = 'compact' | 'standard' | 'large';

export interface StorageStats {
  totalPhotos: number;
  trashCount: number;
  favoritesCount: number;
  totalSizeBytes: number;
}
