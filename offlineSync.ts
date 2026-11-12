import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ClassReport, VisitReport, B1TaskSubmission } from '../types';

const STORAGE_KEYS = {
  REPORTS: 'base_metrics_offline_reports',
  VISITS: 'base_metrics_offline_visits',
  TASKS: 'base_metrics_offline_tasks',
  DRAFTS: 'base_metrics_form_drafts'
};

export interface OfflineItem<T> {
  offlineId: string;
  data: T;
  savedAt: string;
  retryCount: number;
}

// ==========================================
// Local Storage Safe Wrappers
// ==========================================
function getStoredItems<T>(key: string): OfflineItem<T>[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return [];
  }
}

function setStoredItems<T>(key: string, items: OfflineItem<T>[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    // Dispatch event so UI indicators update immediately across all open components
    window.dispatchEvent(new CustomEvent('base_metrics_offline_storage_changed'));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// ==========================================
// Class Reports (Facilitator) Offline Outbox
// ==========================================
export function saveOfflineClassReport(report: ClassReport): OfflineItem<ClassReport> {
  const items = getStoredItems<ClassReport>(STORAGE_KEYS.REPORTS);
  const offlineItem: OfflineItem<ClassReport> = {
    offlineId: `offline_report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    data: { ...report, notes: report.notes ? `${report.notes} (Collected Offline)` : '(Collected Offline)' },
    savedAt: new Date().toISOString(),
    retryCount: 0
  };
  items.push(offlineItem);
  setStoredItems(STORAGE_KEYS.REPORTS, items);
  return offlineItem;
}

export function getPendingClassReports(): OfflineItem<ClassReport>[] {
  return getStoredItems<ClassReport>(STORAGE_KEYS.REPORTS);
}

export function removePendingClassReport(offlineId: string): void {
  const items = getStoredItems<ClassReport>(STORAGE_KEYS.REPORTS);
  const filtered = items.filter(i => i.offlineId !== offlineId);
  setStoredItems(STORAGE_KEYS.REPORTS, filtered);
}

// ==========================================
// Visit Reports (Supervisor) Offline Outbox
// ==========================================
export function saveOfflineVisit(visit: VisitReport): OfflineItem<VisitReport> {
  const items = getStoredItems<VisitReport>(STORAGE_KEYS.VISITS);
  const offlineItem: OfflineItem<VisitReport> = {
    offlineId: `offline_visit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    data: visit,
    savedAt: new Date().toISOString(),
    retryCount: 0
  };
  items.push(offlineItem);
  setStoredItems(STORAGE_KEYS.VISITS, items);
  return offlineItem;
}

export function getPendingVisits(): OfflineItem<VisitReport>[] {
  return getStoredItems<VisitReport>(STORAGE_KEYS.VISITS);
}

export function removePendingVisit(offlineId: string): void {
  const items = getStoredItems<VisitReport>(STORAGE_KEYS.VISITS);
  const filtered = items.filter(i => i.offlineId !== offlineId);
  setStoredItems(STORAGE_KEYS.VISITS, filtered);
}

// ==========================================
// B1 Task Submissions Offline Outbox
// ==========================================
export function saveOfflineTaskSubmission(task: B1TaskSubmission): OfflineItem<B1TaskSubmission> {
  const items = getStoredItems<B1TaskSubmission>(STORAGE_KEYS.TASKS);
  const offlineItem: OfflineItem<B1TaskSubmission> = {
    offlineId: `offline_task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    data: task,
    savedAt: new Date().toISOString(),
    retryCount: 0
  };
  items.push(offlineItem);
  setStoredItems(STORAGE_KEYS.TASKS, items);
  return offlineItem;
}

export function getPendingTaskSubmissions(): OfflineItem<B1TaskSubmission>[] {
  return getStoredItems<B1TaskSubmission>(STORAGE_KEYS.TASKS);
}

export function removePendingTaskSubmission(offlineId: string): void {
  const items = getStoredItems<B1TaskSubmission>(STORAGE_KEYS.TASKS);
  const filtered = items.filter(i => i.offlineId !== offlineId);
  setStoredItems(STORAGE_KEYS.TASKS, filtered);
}

// ==========================================
// Form Draft Auto-Saving (Protects unsubmitted data)
// ==========================================
export function saveFormDraft(formKey: string, formData: any): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DRAFTS);
    const drafts = raw ? JSON.parse(raw) : {};
    drafts[formKey] = {
      data: formData,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
  } catch (e) {
    console.error('Error saving draft:', e);
  }
}

export function getFormDraft<T>(formKey: string): { data: T; updatedAt: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DRAFTS);
    if (!raw) return null;
    const drafts = JSON.parse(raw);
    return drafts[formKey] || null;
  } catch (e) {
    return null;
  }
}

export function clearFormDraft(formKey: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DRAFTS);
    if (!raw) return;
    const drafts = JSON.parse(raw);
    delete drafts[formKey];
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
  } catch (e) {
    console.error('Error clearing draft:', e);
  }
}

export function getTotalPendingCount(): number {
  const reports = getPendingClassReports().length;
  const visits = getPendingVisits().length;
  const tasks = getPendingTaskSubmissions().length;
  return reports + visits + tasks;
}

// ==========================================
// Automatic & Manual Cloud Sync Engine
// ==========================================
export async function syncAllOfflineData(): Promise<{
  syncedReports: number;
  syncedVisits: number;
  syncedTasks: number;
  totalSynced: number;
  errors: string[];
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedReports: 0, syncedVisits: 0, syncedTasks: 0, totalSynced: 0, errors: ['Device is currently offline'] };
  }

  let syncedReports = 0;
  let syncedVisits = 0;
  let syncedTasks = 0;
  const errors: string[] = [];

  // 1. Sync Class Reports
  const pendingReports = getPendingClassReports();
  for (const item of pendingReports) {
    try {
      // Remove any temporary client-side IDs before writing to Firestore
      const { id, ...cleanData } = item.data;
      await addDoc(collection(db, 'reports'), cleanData);
      removePendingClassReport(item.offlineId);
      syncedReports++;
    } catch (err: any) {
      console.error(`Failed to sync offline report ${item.offlineId}:`, err);
      errors.push(`Report ${item.data.learningCenterName}: ${err.message || 'Network error'}`);
    }
  }

  // 2. Sync Visits
  const pendingVisits = getPendingVisits();
  for (const item of pendingVisits) {
    try {
      const { id, ...cleanData } = item.data;
      await addDoc(collection(db, 'visits'), cleanData);
      removePendingVisit(item.offlineId);
      syncedVisits++;
    } catch (err: any) {
      console.error(`Failed to sync offline visit ${item.offlineId}:`, err);
      errors.push(`Visit ${item.data.learningCenterName}: ${err.message || 'Network error'}`);
    }
  }

  // 3. Sync B1 Tasks
  const pendingTasks = getPendingTaskSubmissions();
  for (const item of pendingTasks) {
    try {
      const { id, ...cleanData } = item.data;
      await addDoc(collection(db, 'task_submissions'), cleanData);
      removePendingTaskSubmission(item.offlineId);
      syncedTasks++;
    } catch (err: any) {
      console.error(`Failed to sync offline task ${item.offlineId}:`, err);
      errors.push(`Task ${item.data.locationName}: ${err.message || 'Network error'}`);
    }
  }

  const totalSynced = syncedReports + syncedVisits + syncedTasks;
  if (totalSynced > 0) {
    window.dispatchEvent(new CustomEvent('base_metrics_sync_success', {
      detail: { syncedReports, syncedVisits, syncedTasks, totalSynced }
    }));
  }

  return { syncedReports, syncedVisits, syncedTasks, totalSynced, errors };
}

// ==========================================
// React Hook for Offline & Auto-Sync Status
// ==========================================
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(getTotalPendingCount());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ totalSynced: number; timestamp: string } | null>(null);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getTotalPendingCount());
  }, []);

  const triggerSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      const res = await syncAllOfflineData();
      if (res.totalSynced > 0) {
        setLastSyncResult({ totalSynced: res.totalSynced, timestamp: new Date().toLocaleTimeString() });
      }
    } finally {
      setIsSyncing(false);
      refreshPendingCount();
    }
  }, [isSyncing, refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger automatic sync immediately when internet connection is restored!
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleStorageChange = () => {
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('base_metrics_offline_storage_changed', handleStorageChange);

    // Periodic check every 25 seconds when online to clear any stranded queue items
    const interval = setInterval(() => {
      if (navigator.onLine && getTotalPendingCount() > 0) {
        triggerSync();
      } else {
        refreshPendingCount();
      }
    }, 25000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('base_metrics_offline_storage_changed', handleStorageChange);
      clearInterval(interval);
    };
  }, [triggerSync, refreshPendingCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncResult,
    triggerSync,
    refreshPendingCount
  };
}
