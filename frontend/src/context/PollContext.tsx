import React, { createContext, useContext, useRef, useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';

interface PollContextType {
  startPoll: (id: string, opPath: string) => void;
  refresh: () => Promise<void>;
  items: any[];
  loading: boolean;
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
  const polls = useRef<Record<string, any>>({});

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

    console.log(`🔄 [Poll:${id}] Starting — operation: ${opId}`);

    polls.current[id] = setInterval(async () => {
      try {
        const res = await api.checkOperation(opId!);
        
        if (!res.success) {
          console.error(`❌ [Poll:${id}] API call failed:`, res.error);
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
          console.log(`⏳ [Poll:${id}] Operation not done yet...`);
          return;
        }

        if (op.error) {
          console.error(`❌ [Poll:${id}] Operation error:`, op.error);
          clearInterval(polls.current[id]);
          delete polls.current[id];
          await api.updateItem(id, { status: 'error', errorMessage: op.error.message || 'Upload operation failed' });
          refresh();
          return;
        }

        if (!assetId) {
          console.log(`⚠️ [Poll:${id}] Done but no assetId.`);
          clearInterval(polls.current[id]);
          delete polls.current[id];
          await api.updateItem(id, { status: 'success' });
          refresh();
          return;
        }

        // Check moderation
        console.log(`🔍 [Poll:${id}] Checking moderation for asset: ${assetId}`);
        const meta = await api.getAssetMeta(assetId);
        const robloxData = meta?.metadata || meta;
        const moderationState = (robloxData?.moderationResult?.moderationState || '').trim().toLowerCase();

        console.log(`🏷️ [Poll:${id}] Moderation state: "${moderationState}"`);

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
          refresh();
        } else if (moderationState === 'reviewing') {
          await api.updateItem(id, { status: 'reviewing', assetId });
          refresh();
        } else {
          console.log(`⏳ [Poll:${id}] Unknown state "${moderationState}", keep polling...`);
          await api.updateItem(id, { assetId });
          refresh();
        }
      } catch (e) {
        console.error(`❌ [Poll:${id}] Error:`, e);
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
    <PollContext.Provider value={{ startPoll, refresh, items, loading }}>
      {children}
    </PollContext.Provider>
  );
};
