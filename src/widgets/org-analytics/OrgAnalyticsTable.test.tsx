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

function render(onSelect = vi.fn(), selectedId: string | null = null) {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<OrgAnalyticsTable graph={graph} aggregates={aggregates} selectedId={selectedId} onSelect={onSelect} />));
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

  it('supports roving tabindex and Enter selection', () => {
    const onSelect = render();
    const rows = container.querySelectorAll('tbody tr');
    act(() => {
      (rows[0] as HTMLTableRowElement).focus();
      rows[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    expect(document.activeElement).toBe(rows[1]);
    act(() => rows[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(onSelect).toHaveBeenCalledWith('child');
  });

  it('brings an externally selected row into the visible table area', () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
    render(vi.fn(), 'child');
    expect(scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'nearest' }));
  });

  it('applies a server-provided AI filter and falls back to the name search', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ name: null, levels: [2], headcountMin: null, headcountMax: null, budgetMin: null, budgetMax: null, performanceMin: null, performanceMax: null, sort: null }) }));
    render();
    const input = container.querySelector('input') as HTMLInputElement;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, 'уровень 2');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      (container.querySelector('button') as HTMLButtonElement).click();
    });
    expect(container.textContent).toContain('AI-фильтр применён');
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it('falls back to an immediate name search if AI interpretation fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    render();
    const input = container.querySelector('input') as HTMLInputElement;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, 'Альфа');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      (container.querySelector('button') as HTMLButtonElement).click();
    });
    expect(container.textContent).toContain('AI-поиск недоступен');
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
  });
});
