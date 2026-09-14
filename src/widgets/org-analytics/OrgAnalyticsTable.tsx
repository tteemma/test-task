import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { filterAndSortRows, formatBudget, formatPerformance, getAnalyticsRows, nextSortState, type SortField, type SortState } from '@/entities/org-node/model/analytics';
import type { OrgAggregate, OrgGraph, NodeId } from '@/entities/org-node/model/types';

const Search = styled.div`
  display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; margin-bottom: 14px;
  input { border: 1px solid #cbd5e1; border-radius: 8px; min-width: 0; padding: 9px 11px; }
  button { border: 1px solid #94a3b8; border-radius: 8px; background: #fff; cursor: pointer; padding: 8px 11px; }
`;
const Scroll = styled.div`overflow-x: auto;`;
const Table = styled.table`
  border-collapse: collapse; min-width: 680px; width: 100%;
  th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }
  th { color: #475569; font-size: 12px; letter-spacing: .02em; white-space: nowrap; }
  th button { background: transparent; border: 0; color: inherit; cursor: pointer; font: inherit; font-weight: 700; padding: 0; }
  tbody tr { cursor: pointer; }
  tbody tr:hover { background: #f8fafc; }
  tbody tr[data-selected='true'] { background: #dbeafe; outline: 2px solid #2563eb; outline-offset: -2px; }
  td:not(:first-child) { font-variant-numeric: tabular-nums; white-space: nowrap; }
`;
const Empty = styled.p`color: #64748b; margin: 16px 0;`;

type Props = {
  graph: OrgGraph;
  aggregates: Map<NodeId, OrgAggregate>;
  selectedId: NodeId | null;
  onSelect: (id: NodeId) => void;
};

const columns: Array<{ field: SortField; label: string }> = [
  { field: 'name', label: 'Подразделение' },
  { field: 'level', label: 'Уровень' },
  { field: 'headcount', label: 'Численность' },
  { field: 'budget', label: 'Бюджет' },
  { field: 'performance', label: 'Эффективность' }
];

export function OrgAnalyticsTable({ graph, aggregates, selectedId, onSelect }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(inputValue), 250);
    return () => window.clearTimeout(timer);
  }, [inputValue]);
  const rows = useMemo(() => filterAndSortRows(getAnalyticsRows(graph, aggregates), query, sort), [aggregates, graph, query, sort]);
  const changeSort = (field: SortField) => setSort((current) => nextSortState(current, field));

  return <>
    <Search>
      <input value={inputValue} onChange={(event) => setInputValue(event.target.value)} placeholder="Поиск по названию" aria-label="Поиск по названию подразделения" />
      {inputValue && <button type="button" onClick={() => setInputValue('')} aria-label="Очистить поиск">Очистить</button>}
    </Search>
    {rows.length === 0 ? <Empty role="status">Подразделения не найдены.</Empty> : <Scroll><Table>
      <thead><tr>{columns.map(({ field, label }) => {
        const active = sort?.field === field ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none';
        return <th key={field} aria-sort={active}><button type="button" onClick={() => changeSort(field)}>{label}</button></th>;
      })}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.nodeId} data-selected={selectedId === row.nodeId} onClick={() => onSelect(row.nodeId)}>
        <td>{row.name}</td><td>{row.level}</td><td>{row.totalHeadcount}</td><td>{formatBudget(row.totalBudget)}</td><td>{formatPerformance(row.weightedPerformance)}</td>
      </tr>)}</tbody>
    </Table></Scroll>}
  </>;
}
