import { useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { filterAndSortRows, formatBudget, formatPerformance, getAnalyticsRows, nextSortState, type SortField, type SortState } from '@/entities/org-node/model/analytics';
import type { OrgAggregate, OrgGraph, NodeId } from '@/entities/org-node/model/types';

const Search = styled.div`
  display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; margin-bottom: 14px;
  input { border: 1px solid #cbd5e1; border-radius: 8px; min-width: 0; padding: 9px 11px; }
  button { border: 1px solid #94a3b8; border-radius: 8px; background: #fff; cursor: pointer; padding: 8px 11px; }
`;
const Scroll = styled.div`flex: 1; min-height: 0; min-width: 0; overflow: auto; overscroll-behavior: contain;`;
const flash = keyframes`from { background: #fef3c7; } to { background: transparent; }`;
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
const Changed = styled.span`animation: ${flash} 1.5s ease-out; border-radius: 3px; display: inline-block;`;
const Empty = styled.p`color: #64748b; margin: 16px 0;`;

type Props = {
  graph: OrgGraph;
  aggregates: Map<NodeId, OrgAggregate>;
  selectedId: NodeId | null;
  onSelect: (id: NodeId) => void;
  highlightedRevisions?: Map<NodeId, number>;
};

const columns: Array<{ field: SortField; label: string }> = [
  { field: 'name', label: 'Подразделение' },
  { field: 'level', label: 'Уровень' },
  { field: 'headcount', label: 'Численность' },
  { field: 'budget', label: 'Бюджет' },
  { field: 'performance', label: 'Эффективность' }
];

export function OrgAnalyticsTable({ graph, aggregates, selectedId, onSelect, highlightedRevisions = new Map() }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(inputValue), 250);
    return () => window.clearTimeout(timer);
  }, [inputValue]);
  const rows = useMemo(() => filterAndSortRows(getAnalyticsRows(graph, aggregates), query, sort), [aggregates, graph, query, sort]);
  const changeSort = (field: SortField) => setSort((current) => nextSortState(current, field));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const moveFocus = (index: number) => {
    const nextIndex = Math.max(0, Math.min(rows.length - 1, index));
    setFocusedIndex(nextIndex);
    rowRefs.current[nextIndex]?.focus();
  };
  useEffect(() => {
    if (!selectedId) return;
    const selectedIndex = rows.findIndex((row) => row.nodeId === selectedId);
    const row = rowRefs.current[selectedIndex];
    if (selectedIndex >= 0 && row?.scrollIntoView) {
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      row.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [rows, selectedId]);

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
      <tbody>{rows.map((row, index) => {
        const revision = highlightedRevisions.get(row.nodeId);
        const value = (content: string | number) => revision ? <Changed key={revision}>{content}</Changed> : content;
        return <tr key={row.nodeId} ref={(element) => { rowRefs.current[index] = element; }} aria-selected={selectedId === row.nodeId} data-selected={selectedId === row.nodeId} tabIndex={focusedIndex === index ? 0 : -1} onFocus={() => setFocusedIndex(index)} onClick={() => onSelect(row.nodeId)} onKeyDown={(event) => {
          if (event.key === 'ArrowDown') { event.preventDefault(); moveFocus(index + 1); }
          if (event.key === 'ArrowUp') { event.preventDefault(); moveFocus(index - 1); }
          if (event.key === 'Home') { event.preventDefault(); moveFocus(0); }
          if (event.key === 'End') { event.preventDefault(); moveFocus(rows.length - 1); }
          if (event.key === 'Enter') onSelect(row.nodeId);
        }}>
        <td>{value(row.name)}</td><td>{value(row.level)}</td><td>{value(row.totalHeadcount)}</td><td>{value(formatBudget(row.totalBudget))}</td><td>{value(formatPerformance(row.weightedPerformance))}</td>
      </tr>;
      })}</tbody>
    </Table></Scroll>}
  </>;
}
