import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import styled from 'styled-components';
import { fetchOrgTree } from '@/entities/org-node/api/fetch-org-tree';
import { queryKeys } from '@/shared/api/query-keys';
import { StatusState } from '@/shared/ui/StatusState';
import { OrgTree } from '@/widgets/org-tree/OrgTree';

const Shell = styled.main`max-width: 1100px; margin: 0 auto; padding: 28px 20px 56px;`;
const Header = styled.header`margin-bottom: 24px; h1 { margin: 0; font-size: clamp(26px, 4vw, 38px); } p { color: #64748b; }`;
const Card = styled.section`background: #fff; border-radius: 14px; box-shadow: 0 6px 24px rgb(15 23 42 / 9%); padding: 16px;`;

export function OrgDashboardPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useQuery({ queryKey: queryKeys.orgTree, queryFn: ({ signal }) => fetchOrgTree({ signal }) });
  if (query.isPending) return <StatusState title="Загружаем структуру организации…" />;
  if (query.isError) return <StatusState title="Не удалось загрузить данные" detail={query.error.message} retry={() => void query.refetch()} />;
  if (query.data.graph.orderedIds.length === 0) return <StatusState title="Структура организации пока пуста" detail="Сервер вернул корректный, но пустой список подразделений." />;
  return <Shell><Header><h1>Staff Pulse</h1><p>Структура организации · ревизия {query.data.revision}</p></Header><Card><OrgTree graph={query.data.graph} selectedId={selectedId} onSelect={setSelectedId} /></Card></Shell>;
}
