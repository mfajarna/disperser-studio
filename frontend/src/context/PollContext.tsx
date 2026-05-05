import React, { createContext, useContext, useRef, useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface PollContextType {
  startPoll: (id: string, opPath: string) => void;
  refresh: () => Promise<void>;
  items: any[];
  loading: boolean;
  logs: LogEntry[];
  addLog: (message: string, type?: LogEntry['type']) => void;
  clearLogs: () => void;
}

const PollContext = createContext<PollContextType | null>(null);

export const usePollContext = () => {
  const ctx = useContext(PollContext);
  if (!ctx) throw new Error('usePollContext must be used within PollProvider');
  return ctx;
};

export const PollProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const polls = useRef<Record<string, any>>({});

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(),
      timestamp: Date.now(),
      message,
      type
    }].slice(-50)); // Keep last 50 logs
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getQueue();
      setItems(data);
      return data;
    } catch (e) {
      console.error('Queue refresh failed:', e);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const startPoll = useCallback((id: string, opPath: string) => {
    if (polls.current[id]) return;
    const opId = opPath.split('/').pop();

    addLog(`[Item:${id}] Starting moderation poll for operation: ${opId}`, 'info');

    polls.current[id] = setInterval(async () => {
      try {
        const res = await api.checkOperation(opId!);
        
        if (!res.success) {
          addLog(`[Item:${id}] API call failed: ${res.error}`, 'error');
          return;
        }

        const op = res.operation;
        if (!op) return;

        // Extract assetId from ANY position in the response
        const assetId = op.response?.assetId
          || op.response?.path?.split('/').pop()
          || op.assetId
          || op.path?.replace('assets/', '');

        const isDone = op.done === true || !!op.response || !!assetId;

        if (!isDone) {
          // Silent log to avoid spam
          return;
        }

        if (op.error) {
          addLog(`[Item:${id}] Operation error: ${op.error.message || JSON.stringify(op.error)}`, 'error');
          clearInterval(polls.current[id]);
          delete polls.current[id];
          await api.updateItem(id, { status: 'error', errorMessage: op.error.message || 'Upload operation failed' });
          refresh();
          return;
        }

        if (!assetId) {
          addLog(`[Item:${id}] Done but no assetId found in response.`, 'warning');
          clearInterval(polls.current[id]);
          delete polls.current[id];
          await api.updateItem(id, { status: 'success' });
          refresh();
          return;
        }

        // Check moderation
        addLog(`[Item:${id}] Checking moderation status for asset: ${assetId}`, 'info');
        const meta = await api.getAssetMeta(assetId);
        const robloxData = meta?.metadata || meta;
        const moderationState = (robloxData?.moderationResult?.moderationState || '').trim().toLowerCase();

        addLog(`[Item:${id}] Moderation state: "${moderationState}"`, 'info');

        if (moderationState === 'rejected') {
          clearInterval(polls.current[id]);
          delete polls.current[id];
          await api.updateItem(id, { status: 'rejected', errorMessage: 'Rejected by Roblox Moderation', assetId });
          refresh();
        } else if (moderationState === 'approved') {
          clearInterval(polls.current[id]);
          delete polls.current[id];
          
          await api.updateItem(id, { 
            status: 'success', 
            assetId 
          });
          addLog(`[Item:${id}] Approved by Roblox Moderation!`, 'success');
          refresh();
        } else if (moderationState === 'reviewing') {
          await api.updateItem(id, { status: 'reviewing', assetId });
          refresh();
        } else {
          addLog(`[Item:${id}] Unknown moderation state: "${moderationState}", keep polling...`, 'warning');
          await api.updateItem(id, { assetId });
          refresh();
        }
      } catch (e: any) {
        addLog(`[Item:${id}] Error during poll: ${e.message}`, 'error');
      }
    }, 30000);
  }, [refresh]);

  // On mount: refresh + auto-resume any items stuck in processing
  useEffect(() => {
    const init = async () => {
      const data = await refresh();
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if ((item.status === 'processing' || item.status === 'reviewing') && item.operationPath) {
            startPoll(item.id, item.operationPath);
          }
        });
      }
    };
    init();

    // Background refresh every 30s
    const interval = setInterval(refresh, 30000);

    return () => {
      clearInterval(interval);
      // Don't clear polls on unmount — this provider should live at the app root
    };
  }, [refresh, startPoll]);

  return (
    <PollContext.Provider value={{ startPoll, refresh, items, loading, logs, addLog, clearLogs }}>
      {children}
    </PollContext.Provider>
  );
};
