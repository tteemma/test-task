import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import styled from 'styled-components';
import { fetchOrgTree } from '@/entities/org-node/api/fetch-org-tree';
import { queryKeys } from '@/shared/api/query-keys';
import { StatusState } from '@/shared/ui/StatusState';
import { OrgTree } from '@/widgets/org-tree/OrgTree';
import { OrgAnalyticsTable } from '@/widgets/org-analytics/OrgAnalyticsTable';

const Shell = styled.main`max-width: 1440px; margin: 0 auto; padding: 28px 20px 56px;`;
const Header = styled.header`margin-bottom: 24px; h1 { margin: 0; font-size: clamp(26px, 4vw, 38px); } p { color: #64748b; }`;
const Card = styled.section`background: #fff; border-radius: 14px; box-shadow: 0 6px 24px rgb(15 23 42 / 9%); padding: 16px;`;
const Layout = styled.div`
  display: grid; gap: 18px;
  @media (min-width: 1280px) { grid-template-columns: minmax(360px, .85fr) minmax(540px, 1.15fr); }
`;
const Panel = styled(Card)<{ $visible: boolean }>`
  @media (max-width: 1279px) { display: ${({ $visible }) => $visible ? 'block' : 'none'}; }
`;
const Tabs = styled.div`
  display: flex; gap: 8px; margin: 0 0 12px;
  button { background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; padding: 8px 12px; }
  button[aria-selected='true'] { background: #dbeafe; border-color: #2563eb; color: #1d4ed8; }
  @media (min-width: 1280px) { display: none; }
`;

export function OrgDashboardPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'tree' | 'table'>('tree');
  const query = useQuery({ queryKey: queryKeys.orgTree, queryFn: ({ signal }) => fetchOrgTree({ signal }) });
  if (query.isPending) return <StatusState title="Загружаем структуру организации…" />;
  if (query.isError) return <StatusState title="Не удалось загрузить данные" detail={query.error.message} retry={() => void query.refetch()} />;
  if (query.data.graph.orderedIds.length === 0) return <StatusState title="Структура организации пока пуста" detail="Сервер вернул корректный, но пустой список подразделений." />;
  return <Shell><Header><h1>Staff Pulse</h1><p>Структура организации · ревизия {query.data.revision}</p></Header>
    <Tabs role="tablist" aria-label="Представление данных">
      <button type="button" role="tab" aria-selected={activeView === 'tree'} onClick={() => setActiveView('tree')}>Дерево</button>
      <button type="button" role="tab" aria-selected={activeView === 'table'} onClick={() => setActiveView('table')}>Таблица</button>
    </Tabs>
    <Layout>
      <Panel $visible={activeView === 'tree'}><OrgTree graph={query.data.graph} selectedId={selectedId} onSelect={setSelectedId} /></Panel>
      <Panel $visible={activeView === 'table'}><OrgAnalyticsTable graph={query.data.graph} aggregates={query.data.aggregates} selectedId={selectedId} onSelect={setSelectedId} /></Panel>
    </Layout>
  </Shell>;
}
