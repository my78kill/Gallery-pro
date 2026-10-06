import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Upload } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, blob: Blob) => Promise<void>;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async (mode: 'environment' | 'user') => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: unknown) {
      console.warn('Camera access failed, falling back:', err);
      const msg = err instanceof Error ? err.message : 'Camera permission denied or device not found';
      setCameraError(msg);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const capturePhoto = async () => {
    if (!videoRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            await onCapture(dataUrl, blob);
            onClose();
          }
        },
        'image/jpeg',
        0.95
      );
    } catch (err) {
      console.error('Capture failed:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      await onCapture(reader.result as string, file);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-slate-100 select-none overflow-hidden animate-fadeIn">
      {/* Top Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent z-20">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Device Camera
        </span>

        <button
          onClick={toggleCamera}
          className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
          title="Switch Camera (Front/Rear)"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Viewfinder Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-slate-950">
        {cameraError ? (
          <div className="flex flex-col items-center max-w-xs text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold">Camera Inaccessible</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Camera preview is unavailable or blocked in this browser tab. You can take a photo or select an existing one using your device camera picker:
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-sky-500/20"
            >
              <Upload className="w-4 h-4" />
              <span>Use Device Camera / File</span>
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />
            {/* Viewfinder crosshairs */}
            <div className="absolute inset-12 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="w-8 h-8 border border-white/40 rounded-full" />
            </div>
          </>
        )}
      </div>

      {/* Bottom Shutter Strip */}
      <div className="h-28 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-around px-6 pb-safe z-20">
        {/* Device file fallback */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          id="camera-alt-upload"
          className="hidden"
          onChange={handleFileUpload}
        />
        <label
          htmlFor="camera-alt-upload"
          className="w-11 h-11 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all"
          title="Upload or Take Photo via System Picker"
        >
          <Upload className="w-5 h-5" />
        </label>

        {/* Shutter Button */}
        <button
          onClick={capturePhoto}
          disabled={!!cameraError || isCapturing}
          className="w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-95 transition-all shadow-2xl disabled:opacity-40"
          title="Take Photo"
        >
          <div className="w-full h-full rounded-full bg-white hover:bg-slate-200 flex items-center justify-center transition-colors">
            <Camera className="w-6 h-6 text-slate-950" />
          </div>
        </button>

        <div className="w-11 h-11" />
      </div>
    </div>
  );
};
