import { CropRect, ImageAdjustments } from '../types/gallery';

/**
 * Loads an HTMLImageElement from a dataUrl or URL.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = src;
  });
}

/**
 * Formats byte size into human readable string (e.g. 2.4 MB, 840 KB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formats a timestamp into friendly gallery date label.
 */
export function formatGalleryDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  const isSameYear = date.getFullYear() === now.getFullYear();
  if (isSameYear) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatFullDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Creates an optimized thumbnail from an image source to keep IndexedDB fast and smooth.
 */
export async function createThumbnail(imgSrc: string, maxDim = 400): Promise<string> {
  try {
    const img = await loadImage(imgSrc);
    const canvas = document.createElement('canvas');
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width > height) {
      if (width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      }
    } else {
      if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return imgSrc;

    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return imgSrc;
  }
}

/**
 * Extracts average/dominant color from an image for placeholder scrims.
 */
export async function getDominantColor(imgSrc: string): Promise<string> {
  try {
    const img = await loadImage(imgSrc);
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#1e293b';

    ctx.drawImage(img, 0, 0, 10, 10);
    const data = ctx.getImageData(0, 0, 10, 10).data;
    let r = 0, g = 0, b = 0;
    const count = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return '#1e293b';
  }
}

/**
 * Applies crop, rotation, flip, and adjustments to render the final edited image.
 */
export async function processAndCropImage(
  sourceUrl: string,
  crop: CropRect,
  adjustments: ImageAdjustments,
  mimeType = 'image/jpeg'
): Promise<{ dataUrl: string; width: number; height: number; size: number }> {
  const img = await loadImage(sourceUrl);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  // 1. Calculate actual crop box in source pixels
  const cropPixelX = Math.max(0, Math.min(srcW, (crop.x / 100) * srcW));
  const cropPixelY = Math.max(0, Math.min(srcH, (crop.y / 100) * srcH));
  const cropPixelW = Math.max(1, Math.min(srcW - cropPixelX, (crop.width / 100) * srcW));
  const cropPixelH = Math.max(1, Math.min(srcH - cropPixelY, (crop.height / 100) * srcH));

  // Determine final canvas dimension considering rotation
  const isRotated90or270 = adjustments.rotation === 90 || adjustments.rotation === 270;
  const finalW = Math.round(isRotated90or270 ? cropPixelH : cropPixelW);
  const finalH = Math.round(isRotated90or270 ? cropPixelW : cropPixelH);

  const canvas = document.createElement('canvas');
  canvas.width = finalW;
  canvas.height = finalH;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // 2. Setup filter string
  const filters: string[] = [];
  if (adjustments.brightness !== 100) {
    filters.push(`brightness(${adjustments.brightness}%)`);
  }
  if (adjustments.contrast !== 100) {
    filters.push(`contrast(${adjustments.contrast}%)`);
  }
  if (adjustments.saturation !== 100) {
    filters.push(`saturate(${adjustments.saturation}%)`);
  }
  if (adjustments.sepia > 0) {
    filters.push(`sepia(${adjustments.sepia}%)`);
  }
  if (adjustments.grayscale > 0) {
    filters.push(`grayscale(${adjustments.grayscale}%)`);
  }
  if (adjustments.warmth !== 0) {
    // Warmth simulation via subtle hue-rotate & sepia balance
    if (adjustments.warmth > 0) {
      filters.push(`sepia(${adjustments.warmth * 0.4}%)`);
    } else {
      filters.push(`hue-rotate(${adjustments.warmth * 0.5}deg)`);
    }
  }

  ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';

  // 3. Transformations: Center origin
  ctx.save();
  ctx.translate(finalW / 2, finalH / 2);

  // Apply rotation
  if (adjustments.rotation !== 0) {
    ctx.rotate((adjustments.rotation * Math.PI) / 180);
  }

  // Apply flips
  const scaleX = adjustments.flipHorizontal ? -1 : 1;
  const scaleY = adjustments.flipVertical ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Draw source cropped rect centered
  ctx.drawImage(
    img,
    cropPixelX,
    cropPixelY,
    cropPixelW,
    cropPixelH,
    -cropPixelW / 2,
    -cropPixelH / 2,
    cropPixelW,
    cropPixelH
  );

  ctx.restore();

  const exportType = mimeType.includes('png') ? 'image/png' : 'image/jpeg';
  const quality = exportType === 'image/jpeg' ? 0.92 : undefined;
  const dataUrl = canvas.toDataURL(exportType, quality);

  // Estimate approximate byte size from dataUrl
  const stringLength = dataUrl.length - 'data:image/jpeg;base64,'.length;
  const size = Math.round(stringLength * (3 / 4));

  return {
    dataUrl,
    width: finalW,
    height: finalH,
    size,
  };
}

/**
 * Triggers native browser / Android file download.
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
