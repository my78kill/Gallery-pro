import { Photo, StorageStats } from '../types/gallery';
import { createThumbnail, getDominantColor, loadImage } from '../utils/imageUtils';

// Curated seed assets
import mountainImg from '../assets/images/mountain_sunrise_1791304586733.jpg';
import potteryImg from '../assets/images/pottery_artisan_1791304598837.jpg';
import botanicalImg from '../assets/images/botanical_leaf_1791304611088.jpg';
import neonImg from '../assets/images/neon_tokyo_night_1791304627176.jpg';

const DB_NAME = 'PrismGalleryDB';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('isDeleted', 'isDeleted', { unique: false });
          store.createIndex('album', 'album', { unique: false });
          store.createIndex('isFavorite', 'isFavorite', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Initializes database and seeds sample photos on first launch
   */
  async init(): Promise<void> {
    const db = await this.getDB();
    const count = await this.getCount(db);
    
    // Seed initial photos if completely empty
    if (count === 0) {
      await this.seedInitialPhotos();
    }
  }

  private getCount(db: IDBDatabase): Promise<number> {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  }

  private async seedInitialPhotos(): Promise<void> {
    const seeds = [
      {
        id: 'seed-1',
        name: 'Alpine_Sunrise_Reflection.jpg',
        src: mountainImg,
        album: 'Camera',
        isFavorite: true,
        dateOffset: 0,
      },
      {
        id: 'seed-2',
        name: 'Artisan_Ceramic_Studio.jpg',
        src: potteryImg,
        album: 'Camera',
        isFavorite: false,
        dateOffset: 1000 * 60 * 60 * 3, // 3 hours ago
      },
      {
        id: 'seed-3',
        name: 'Tropical_Dew_Macro.jpg',
        src: botanicalImg,
        album: 'Nature',
        isFavorite: true,
        dateOffset: 1000 * 60 * 60 * 24, // Yesterday
      },
      {
        id: 'seed-4',
        name: 'Kyoto_Twilight_Lanterns.jpg',
        src: neonImg,
        album: 'Wallpapers',
        isFavorite: false,
        dateOffset: 1000 * 60 * 60 * 48, // 2 days ago
      },
    ];

    const now = Date.now();

    for (const item of seeds) {
      try {
        const img = await loadImage(item.src);
        const thumb = await createThumbnail(item.src, 400);
        const color = await getDominantColor(item.src);
        const width = img.naturalWidth || 1920;
        const height = img.naturalHeight || 1080;
        const aspect = width > height ? `${Math.round((width / height) * 10) / 10}:1` : `1:${Math.round((height / width) * 10) / 10}`;

        const photo: Photo = {
          id: item.id,
          name: item.name,
          dataUrl: item.src,
          thumbnailUrl: thumb,
          size: Math.round(width * height * 0.4), // approx 1-2MB
          width,
          height,
          mimeType: 'image/jpeg',
          createdAt: now - item.dateOffset,
          modifiedAt: now - item.dateOffset,
          isFavorite: item.isFavorite,
          album: item.album,
          isDeleted: false,
          deletedAt: null,
          aspectRatio: aspect,
          dominantColor: color,
        };

        await this.savePhoto(photo);
      } catch (err) {
        console.warn('Failed to seed photo:', item.name, err);
      }
    }
  }

  /**
   * Fetches all active non-deleted photos sorted newest to oldest.
   */
  async getAllActivePhotos(): Promise<Photo[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const photos: Photo[] = (req.result || [])
          .filter((p: Photo) => !p.isDeleted)
          .sort((a: Photo, b: Photo) => b.createdAt - a.createdAt);
        resolve(photos);
      };

      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Fetches photos currently staged in the Trash.
   */
  async getTrashedPhotos(): Promise<Photo[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const trashed: Photo[] = (req.result || [])
          .filter((p: Photo) => p.isDeleted)
          .sort((a: Photo, b: Photo) => (b.deletedAt || 0) - (a.deletedAt || 0));
        resolve(trashed);
      };

      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Saves or updates a photo in IndexedDB.
   */
  async savePhoto(photo: Photo): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(photo);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Fetches a single photo by id.
   */
  async getPhotoById(id: string): Promise<Photo | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Soft delete: moves photo to Trash.
   */
  async moveToTrash(id: string): Promise<void> {
    const photo = await this.getPhotoById(id);
    if (!photo) return;
    photo.isDeleted = true;
    photo.deletedAt = Date.now();
    await this.savePhoto(photo);
  }

  async batchMoveToTrash(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.moveToTrash(id);
    }
  }

  /**
   * Restores a photo from Trash back to the active gallery.
   */
  async restoreFromTrash(id: string): Promise<void> {
    const photo = await this.getPhotoById(id);
    if (!photo) return;
    photo.isDeleted = false;
    photo.deletedAt = null;
    await this.savePhoto(photo);
  }

  async batchRestore(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.restoreFromTrash(id);
    }
  }

  /**
   * Permanent Delete: Completely and irreversibly erases the photo from device storage.
   */
  async deletePermanently(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Permanent Batch Delete: Permanently deletes multiple selected photos.
   */
  async batchDeletePermanently(ids: string[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      let remaining = ids.length;
      if (remaining === 0) return resolve();

      for (const id of ids) {
        const req = store.delete(id);
        req.onsuccess = () => {
          remaining--;
          if (remaining === 0) resolve();
        };
        req.onerror = () => reject(req.error);
      }
    });
  }

  /**
   * Empties the entire trash permanently.
   */
  async emptyTrash(): Promise<void> {
    const trashed = await this.getTrashedPhotos();
    const ids = trashed.map((p) => p.id);
    await this.batchDeletePermanently(ids);
  }

  /**
   * Toggles favorite status.
   */
  async toggleFavorite(id: string): Promise<boolean> {
    const photo = await this.getPhotoById(id);
    if (!photo) return false;
    photo.isFavorite = !photo.isFavorite;
    await this.savePhoto(photo);
    return photo.isFavorite;
  }

  /**
   * Calculates storage metrics.
   */
  async getStorageStats(): Promise<StorageStats> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const all: Photo[] = req.result || [];
        let totalSize = 0;
        let trashCount = 0;
        let favCount = 0;
        let activeCount = 0;

        for (const p of all) {
          totalSize += p.size || 0;
          if (p.isDeleted) {
            trashCount++;
          } else {
            activeCount++;
            if (p.isFavorite) favCount++;
          }
        }

        resolve({
          totalPhotos: activeCount,
          trashCount,
          favoritesCount: favCount,
          totalSizeBytes: totalSize,
        });
      };

      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Imports local files from file picker or camera.
   */
  async importLocalFiles(files: FileList | File[], album = 'Camera'): Promise<Photo[]> {
    const fileList = Array.from(files);
    const importedPhotos: Photo[] = [];
    const now = Date.now();

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith('image/')) continue;

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const img = await loadImage(dataUrl);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const thumb = await createThumbnail(dataUrl, 400);
      const color = await getDominantColor(dataUrl);
      const aspect = width > height ? `${Math.round((width / height) * 10) / 10}:1` : `1:${Math.round((height / width) * 10) / 10}`;

      const photo: Photo = {
        id: `photo_${now}_${i}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name || `IMG_${new Date(now).toISOString().replace(/[-:T.]/g, '').slice(0, 14)}.jpg`,
        dataUrl,
        thumbnailUrl: thumb,
        size: file.size,
        width,
        height,
        mimeType: file.type || 'image/jpeg',
        createdAt: file.lastModified || now - i * 1000,
        modifiedAt: now,
        isFavorite: false,
        album,
        isDeleted: false,
        deletedAt: null,
        aspectRatio: aspect,
        dominantColor: color,
      };

      await this.savePhoto(photo);
      importedPhotos.push(photo);
    }

    return importedPhotos;
  }
}

export const storage = new StorageService();
