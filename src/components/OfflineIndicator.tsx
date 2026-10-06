import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-sm flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-amber-500/90 text-slate-950 text-xs font-semibold backdrop-blur-md shadow-lg shadow-amber-500/20 border border-amber-400/40">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-slate-950" />
        <span>Offline Mode — All photos and edits saved to device storage</span>
      </div>
    </div>
  );
};
