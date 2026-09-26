import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center space-x-2 bg-amber-600/95 border border-amber-400/80 text-white px-3.5 py-2 rounded-xl text-xs font-mono font-medium shadow-2xl backdrop-blur-md animate-pulse">
      <WifiOff className="w-4 h-4 text-amber-200" />
      <span>Modo Offline: Usando cache PWA local</span>
    </div>
  );
};
