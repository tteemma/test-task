import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { fetchOrgTree } from '@/entities/org-node/api/fetch-org-tree';
import { queryKeys } from '@/shared/api/query-keys';
import { StatusState } from '@/shared/ui/StatusState';
import { OrgTree } from '@/widgets/org-tree/OrgTree';
import { OrgAnalyticsTable } from '@/widgets/org-analytics/OrgAnalyticsTable';
import { useOrgTreeEvents, type ConnectionStatus } from '@/features/live-org-updates/useOrgTreeEvents';

const Shell = styled.main`display: flex; flex-direction: column; height: 100svh; max-width: 1440px; margin: 0 auto; overflow: hidden; padding: 28px 20px 56px;`;
const Header = styled.header`align-items: start; display: flex; gap: 14px; justify-content: space-between; margin-bottom: 24px; h1 { margin: 0; font-size: clamp(26px, 4vw, 38px); } p { color: #64748b; }`;
const Card = styled.section`background: #fff; border-radius: 14px; box-shadow: 0 6px 24px rgb(15 23 42 / 9%); padding: 16px;`;
const Layout = styled.div`
  display: grid; flex: 1; gap: 18px; min-height: 0; overflow: hidden;
  @media (min-width: 1280px) { grid-template-columns: minmax(360px, .85fr) minmax(540px, 1.15fr); }
`;
const Panel = styled(Card)<{ $visible: boolean }>`
  display: flex; flex-direction: column; height: 100%; min-height: 0; min-width: 0; overflow: hidden;
  @media (max-width: 1279px) { display: ${({ $visible }) => $visible ? 'flex' : 'none'}; }
`;
const Tabs = styled.div`
  display: flex; gap: 8px; margin: 0 0 12px;
  button { background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; padding: 8px 12px; }
  button[aria-selected='true'] { background: #dbeafe; border-color: #2563eb; color: #1d4ed8; }
  @media (min-width: 1280px) { display: none; }
`;
const Connection = styled.span<{ $status: ConnectionStatus }>`
  border-radius: 999px; font-size: 13px; font-weight: 700; padding: 6px 10px; white-space: nowrap;
  background: ${({ $status }) => $status === 'online' ? '#dcfce7' : $status === 'offline' ? '#fee2e2' : '#fef3c7'};
  color: ${({ $status }) => $status === 'online' ? '#166534' : $status === 'offline' ? '#991b1b' : '#92400e'};
`;
const statusLabel: Record<ConnectionStatus, string> = { connecting: 'Подключение', online: 'Онлайн', reconnecting: 'Переподключение', offline: 'Офлайн' };

function LiveUpdates({ revision, onPatch, onStatus, onRecover }: { revision: number; onPatch: (nodeId: string, revision: number) => void; onStatus: (status: ConnectionStatus) => void; onRecover: () => Promise<unknown> }) {
  const status = useOrgTreeEvents({ revision, onPatch, onRecover });
  useEffect(() => onStatus(status), [onStatus, status]);
  return null;
}

export function OrgDashboardPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'tree' | 'table'>('tree');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [highlightedRevisions, setHighlightedRevisions] = useState<Map<string, number>>(() => new Map());
  const query = useQuery({ queryKey: queryKeys.orgTree, queryFn: ({ signal }) => fetchOrgTree({ signal }) });
  const graph = query.data?.graph;
  const refetch = query.refetch;
  const markPatched = useCallback((nodeId: string, revision: number) => {
    if (!graph) return;
    setHighlightedRevisions((previous) => {
      const next = new Map(previous);
      let current: string | null = nodeId;
      while (current) {
        next.set(current, revision);
        current = graph.parentById.get(current) ?? null;
      }
      return next;
    });
  }, [graph]);
  const recover = useCallback(() => refetch(), [refetch]);
  if (query.isPending) return <StatusState title="Загружаем структуру организации…" />;
  if (query.isError) return <StatusState title="Не удалось загрузить данные" detail={query.error.message} retry={() => void query.refetch()} />;
  if (query.data.graph.orderedIds.length === 0) return <StatusState title="Структура организации пока пуста" detail="Сервер вернул корректный, но пустой список подразделений." />;
  return <Shell><LiveUpdates revision={query.data.revision} onPatch={markPatched} onStatus={setConnectionStatus} onRecover={recover} /><Header><div><h1>Staff Pulse</h1><p>Структура организации · ревизия {query.data.revision}</p></div><Connection $status={connectionStatus}>{statusLabel[connectionStatus]}</Connection></Header>
    <Tabs role="tablist" aria-label="Представление данных">
      <button type="button" role="tab" aria-selected={activeView === 'tree'} onClick={() => setActiveView('tree')}>Дерево</button>
      <button type="button" role="tab" aria-selected={activeView === 'table'} onClick={() => setActiveView('table')}>Таблица</button>
    </Tabs>
    <Layout>
      <Panel $visible={activeView === 'tree'}><OrgTree graph={query.data.graph} selectedId={selectedId} onSelect={setSelectedId} highlightedRevisions={highlightedRevisions} /></Panel>
      <Panel $visible={activeView === 'table'}><OrgAnalyticsTable graph={query.data.graph} aggregates={query.data.aggregates} selectedId={selectedId} onSelect={setSelectedId} highlightedRevisions={highlightedRevisions} /></Panel>
    </Layout>
  </Shell>;
}
