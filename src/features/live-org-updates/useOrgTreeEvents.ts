import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { orgNodePatchSchema } from '../../../shared/contracts/org-node.contract';
import type { OrgTreeResponse } from '@/entities/org-node/api/fetch-org-tree';
import { applyOrgNodePatch } from '@/entities/org-node/model/apply-org-node-patch';
import { queryKeys } from '@/shared/api/query-keys';

export type ConnectionStatus = 'connecting' | 'online' | 'reconnecting' | 'offline';
type Props = { revision: number; onPatch: (nodeId: string, revision: number) => void; onRecover: () => Promise<unknown> };

const jitteredDelay = (attempt: number) => {
  const base = Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5));
  return base * (.8 + Math.random() * .4);
};

export function useOrgTreeEvents({ revision, onPatch, onRecover }: Props): ConnectionStatus {
  const client = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const latestRevision = useRef(revision);
  const source = useRef<EventSource | null>(null);
  const retryTimer = useRef<number | null>(null);
  const attempt = useRef(0);
  const callbacks = useRef({ onPatch, onRecover });
  callbacks.current = { onPatch, onRecover };

  useEffect(() => {
    let disposed = false;
    const clear = () => {
      source.current?.close();
      source.current = null;
      if (retryTimer.current !== null) window.clearTimeout(retryTimer.current);
      retryTimer.current = null;
    };
    const recover = () => {
      clear();
      if (disposed) return;
      void callbacks.current.onRecover().finally(() => {
        if (!disposed) {
          latestRevision.current = (client.getQueryData<OrgTreeResponse>(queryKeys.orgTree)?.revision ?? latestRevision.current);
          connect();
        }
      });
    };
    const reconnect = () => {
      clear();
      if (disposed) return;
      setStatus(attempt.current >= 5 ? 'offline' : 'reconnecting');
      retryTimer.current = window.setTimeout(connect, jitteredDelay(attempt.current));
      attempt.current += 1;
    };
    const connect = () => {
      if (disposed) return;
      setStatus(attempt.current === 0 ? 'connecting' : 'reconnecting');
      const eventSource = new EventSource(`/api/org-tree/events?since=${latestRevision.current}`);
      source.current = eventSource;
      eventSource.addEventListener('org-node.patch', (event) => {
        let payload: unknown;
        try { payload = JSON.parse((event as MessageEvent<string>).data); } catch { return recover(); }
        const parsed = orgNodePatchSchema.safeParse(payload);
        if (!parsed.success) return recover();
        const patch = parsed.data;
        if (patch.revision <= latestRevision.current) return;
        if (patch.revision !== latestRevision.current + 1) return recover();
        let applied = false;
        client.setQueryData<OrgTreeResponse>(queryKeys.orgTree, (current) => {
          if (!current) return current;
          const next = applyOrgNodePatch(current, patch);
          applied = next !== null;
          return next ?? current;
        });
        if (!applied) return recover();
        latestRevision.current = patch.revision;
        attempt.current = 0;
        setStatus('online');
        callbacks.current.onPatch(patch.nodeId, patch.revision);
      });
      eventSource.addEventListener('sync-required', recover);
      eventSource.onopen = () => { attempt.current = 0; setStatus('online'); };
      eventSource.onerror = reconnect;
    };
    connect();
    return () => { disposed = true; clear(); };
  }, [client]);
  return status;
}
