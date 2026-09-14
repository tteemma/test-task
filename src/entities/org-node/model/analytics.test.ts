import { describe, expect, it } from 'vitest';
import type { AnalyticsRow } from './analytics';
import { filterAndSortRows, formatBudget, formatPerformance, nextSortState, normalizeSearch } from './analytics';

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
});
