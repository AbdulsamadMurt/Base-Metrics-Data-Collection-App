import React from 'react';
import { useOfflineSync } from '../lib/offlineSync';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import { cn } from '../lib/utils';

export default function OfflineSyncBanner({ className }: { className?: string }) {
  const { isOnline, pendingCount, isSyncing, lastSyncResult, triggerSync } = useOfflineSync();

  // If online and no pending items and no recent sync notification, show a minimal discreet badge
  if (isOnline && pendingCount === 0 && !lastSyncResult) {
    return (
      <div className={cn("flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-[11px] text-[#8b949e]", className)}>
        <span className="w-2 h-2 rounded-full bg-[#2ea043] animate-pulse" />
        <span className="text-[#f0f6fc] font-medium">Online & Synced</span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border transition-all animate-fadeIn", className, 
      !isOnline 
        ? "bg-amber-500/10 border-amber-500/30 text-amber-300 p-3" 
        : pendingCount > 0 
        ? "bg-[#58a6ff]/10 border-[#58a6ff]/30 text-[#f0f6fc] p-3"
        : "bg-[#238636]/10 border-[#238636]/30 text-[#2ea043] p-2.5"
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5">
          {!isOnline ? (
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4 text-amber-400" />
            </div>
          ) : pendingCount > 0 ? (
            <div className="w-7 h-7 rounded-lg bg-[#58a6ff]/20 flex items-center justify-center shrink-0">
              <CloudUpload className="w-4 h-4 text-[#58a6ff]" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-lg bg-[#238636]/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2ea043]" />
            </div>
          )}

          <div>
            {!isOnline ? (
              <>
                <p className="text-xs font-bold text-amber-300">
                  Offline Mode Active
                </p>
                <p className="text-[11px] text-amber-300/80">
                  Continue recording data normally. Reports are saved securely on this device and will sync automatically once internet returns.
                  {pendingCount > 0 && <span className="font-semibold text-white ml-1">({pendingCount} pending upload)</span>}
                </p>
              </>
            ) : pendingCount > 0 ? (
              <>
                <p className="text-xs font-bold text-[#f0f6fc]">
                  Connection Restored — {pendingCount} Record(s) Ready to Sync
                </p>
                <p className="text-[11px] text-[#8b949e]">
                  Uploading your locally saved submissions to the central database...
                </p>
              </>
            ) : (
              <p className="text-xs text-[#2ea043] font-medium">
                ✅ All offline records synced at {lastSyncResult?.timestamp}!
              </p>
            )}
          </div>
        </div>

        {/* Sync Action Button */}
        {isOnline && pendingCount > 0 && (
          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
