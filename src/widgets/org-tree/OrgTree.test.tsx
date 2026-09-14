import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import type { OrgNode } from '../../../shared/contracts/org-node.contract';
import { createOrgGraph } from '@/entities/org-node/model/create-org-graph';
import { OrgTree } from './OrgTree';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const graph = createOrgGraph([
  { id: 'root', name: 'Root', parentId: null, headcount: 1, budget: 1, performance: 1, updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'child', name: 'Child', parentId: 'root', headcount: 1, budget: 1, performance: 1, updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'leaf', name: 'Leaf', parentId: 'child', headcount: 1, budget: 1, performance: 1, updatedAt: '2026-01-01T00:00:00.000Z' }
] satisfies OrgNode[]);
let container: HTMLDivElement;
let root: Root;

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function Harness() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return <><button type="button" onClick={() => setSelectedId('leaf')}>Выбрать строку таблицы</button><OrgTree graph={graph} selectedId={selectedId} onSelect={setSelectedId} /></>;
}

describe('OrgTree', () => {
  it('reveals and highlights a node selected from another view', () => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => root.render(<Harness />));
    expect(container.querySelector('[aria-label="Выбрать Leaf"]')).toBeNull();
    act(() => (container.querySelector('button') as HTMLButtonElement).click());
    const selectedLeaf = container.querySelector('[aria-label="Выбрать Leaf"]');
    expect(selectedLeaf).not.toBeNull();
    expect(selectedLeaf?.getAttribute('aria-pressed')).toBe('true');
  });
});
