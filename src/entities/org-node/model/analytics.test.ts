import { describe, expect, it } from 'vitest';
import type { AnalyticsRow } from './analytics';
import { filterAndSortRows, formatBudget, formatPerformance, nextSortState, normalizeSearch } from './analytics';
import { emptyOrgSearchFilter } from '../../../../shared/contracts/org-search.contract';

const rows: AnalyticsRow[] = [
  { nodeId: 'a', name: '  Альфа   команда ', level: 2, totalHeadcount: 2, totalBudget: 1200, weightedPerformance: 50 },
  { nodeId: 'b', name: 'Бета', level: 1, totalHeadcount: 2, totalBudget: 1200, weightedPerformance: null },
  { nodeId: 'c', name: 'Гамма', level: 3, totalHeadcount: 6, totalBudget: 900, weightedPerformance: 80 }
];

describe('analytics helpers', () => {
  it('formats metrics for the Russian interface', () => {
    expect(formatBudget(12_345_678)).toBe('12 345 678 руб.');
    expect(formatPerformance(42.25)).toBe('42,3%');
    expect(formatPerformance(null)).toBe('—');
  });

  it('normalizes whitespace and case for search', () => {
    expect(normalizeSearch('  АЛЬФА   команда ')).toBe('альфа команда');
    expect(filterAndSortRows(rows, 'альфа команда', null).map(({ nodeId }) => nodeId)).toEqual(['a']);
  });

  it('sorts stably and puts missing performance last', () => {
    expect(filterAndSortRows(rows, '', { field: 'budget', direction: 'asc' }).map(({ nodeId }) => nodeId)).toEqual(['c', 'a', 'b']);
    expect(filterAndSortRows(rows, '', { field: 'performance', direction: 'desc' }).map(({ nodeId }) => nodeId)).toEqual(['c', 'a', 'b']);
  });

  it('selects ascending then toggles the selected field', () => {
    expect(nextSortState(null, 'name')).toEqual({ field: 'name', direction: 'asc' });
    expect(nextSortState({ field: 'name', direction: 'asc' }, 'name')).toEqual({ field: 'name', direction: 'desc' });
  });

  it('applies every structured AI filter on the client', () => {
    const filter = { ...emptyOrgSearchFilter(), name: 'гамма', levels: [3] as Array<1 | 2 | 3>, headcountMin: 5, headcountMax: 6, budgetMin: 800, budgetMax: 1_000, performanceMin: 70, performanceMax: 90, sort: { field: 'budget' as const, direction: 'desc' as const } };
    expect(filterAndSortRows(rows, '', null, filter).map(({ nodeId }) => nodeId)).toEqual(['c']);
  });

  it('excludes unknown performance when a performance limit is requested', () => {
    const filter = { ...emptyOrgSearchFilter(), performanceMin: 1 };
    expect(filterAndSortRows(rows, '', null, filter).map(({ nodeId }) => nodeId)).toEqual(['a', 'c']);
  });
});
