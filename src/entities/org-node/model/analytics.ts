import type { OrgNode } from '../../../../shared/contracts/org-node.contract';
import type { OrgSearchFilter } from '../../../../shared/contracts/org-search.contract';
import type { OrgAggregate, OrgGraph, NodeId } from './types';

export type AnalyticsRow = OrgAggregate & Pick<OrgNode, 'name'>;
export type SortField = 'name' | 'level' | 'headcount' | 'budget' | 'performance';
export type SortDirection = 'asc' | 'desc';
export type SortState = { field: SortField; direction: SortDirection } | null;

export const normalizeSearch = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');
export const formatBudget = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} руб.`;
export const formatPerformance = (value: number | null) => value === null ? '—' : `${value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

export function getAnalyticsRows(graph: OrgGraph, aggregates: Map<NodeId, OrgAggregate>): AnalyticsRow[] {
  return graph.orderedIds.flatMap((id) => {
    const node = graph.nodesById.get(id);
    const aggregate = aggregates.get(id);
    return node && aggregate ? [{ ...aggregate, name: node.name }] : [];
  });
}

const compareValues = (left: AnalyticsRow, right: AnalyticsRow, field: SortField): number => {
  if (field === 'name') return left.name.localeCompare(right.name, 'ru');
  if (field === 'level') return left.level - right.level;
  if (field === 'headcount') return left.totalHeadcount - right.totalHeadcount;
  if (field === 'budget') return left.totalBudget - right.totalBudget;
  if (left.weightedPerformance === null) return right.weightedPerformance === null ? 0 : 1;
  if (right.weightedPerformance === null) return -1;
  return left.weightedPerformance - right.weightedPerformance;
};

export function filterAndSortRows(rows: AnalyticsRow[], query: string, sort: SortState, aiFilter: OrgSearchFilter | null = null): AnalyticsRow[] {
  const normalizedQuery = normalizeSearch(query);
  const filtered = rows.filter((row) => {
    if (normalizedQuery && !normalizeSearch(row.name).includes(normalizedQuery)) return false;
    if (!aiFilter) return true;
    if (aiFilter.name && !normalizeSearch(row.name).includes(normalizeSearch(aiFilter.name))) return false;
    if (aiFilter.levels && !aiFilter.levels.includes(row.level as 1 | 2 | 3)) return false;
    if (aiFilter.headcountMin !== null && row.totalHeadcount < aiFilter.headcountMin) return false;
    if (aiFilter.headcountMax !== null && row.totalHeadcount > aiFilter.headcountMax) return false;
    if (aiFilter.budgetMin !== null && row.totalBudget < aiFilter.budgetMin) return false;
    if (aiFilter.budgetMax !== null && row.totalBudget > aiFilter.budgetMax) return false;
    if (aiFilter.performanceMin !== null && (row.weightedPerformance === null || row.weightedPerformance < aiFilter.performanceMin)) return false;
    if (aiFilter.performanceMax !== null && (row.weightedPerformance === null || row.weightedPerformance > aiFilter.performanceMax)) return false;
    return true;
  });
  const effectiveSort = aiFilter?.sort ?? sort;
  if (!effectiveSort) return filtered;
  return filtered
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      if (effectiveSort.field === 'performance') {
        if (left.row.weightedPerformance === null) return right.row.weightedPerformance === null ? left.index - right.index : 1;
        if (right.row.weightedPerformance === null) return -1;
      }
      const comparison = compareValues(left.row, right.row, effectiveSort.field);
      if (comparison === 0) return left.index - right.index;
      return effectiveSort.direction === 'asc' ? comparison : -comparison;
    })
    .map(({ row }) => row);
}

export function nextSortState(current: SortState, field: SortField): SortState {
  if (!current || current.field !== field) return { field, direction: 'asc' };
  return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}
