import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OrgNode } from '../../../shared/contracts/org-node.contract';
import { createOrgAggregates } from '@/entities/org-node/model/create-org-aggregates';
import { createOrgGraph } from '@/entities/org-node/model/create-org-graph';
import { OrgAnalyticsTable } from './OrgAnalyticsTable';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const nodes: OrgNode[] = [
  { id: 'root', name: 'Бета', parentId: null, headcount: 2, budget: 1_000, performance: 50, updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'child', name: 'Альфа команда', parentId: 'root', headcount: 3, budget: 300, performance: 80, updatedAt: '2026-01-01T00:00:00.000Z' }
];
const graph = createOrgGraph(nodes);
const aggregates = createOrgAggregates(graph);
let container: HTMLDivElement;
let root: Root;

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

function render(onSelect = vi.fn()) {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<OrgAnalyticsTable graph={graph} aggregates={aggregates} selectedId={null} onSelect={onSelect} />));
  return onSelect;
}

describe('OrgAnalyticsTable', () => {
  it('sorts columns and reports aria-sort', () => {
    render();
    const nameHeader = container.querySelector('th') as HTMLTableCellElement;
    expect(nameHeader.getAttribute('aria-sort')).toBe('none');
    act(() => nameHeader.querySelector('button')?.click());
    expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');
    expect(container.querySelector('tbody tr td')?.textContent).toBe('Альфа команда');
  });

  it('debounces a normalized search and clears it', () => {
    vi.useFakeTimers();
    render();
    const input = container.querySelector('input') as HTMLInputElement;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, '  АЛЬФА   команда  ');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      vi.advanceTimersByTime(249);
    });
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
    act(() => vi.advanceTimersByTime(1));
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
    act(() => (container.querySelector('[aria-label="Очистить поиск"]') as HTMLButtonElement).click());
    act(() => vi.advanceTimersByTime(250));
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('selects the corresponding organization node', () => {
    const onSelect = render();
    act(() => (container.querySelectorAll('tbody tr')[1] as HTMLTableRowElement).click());
    expect(onSelect).toHaveBeenCalledWith('child');
  });
});
