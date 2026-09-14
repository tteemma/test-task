import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OrgNode } from '../../../shared/contracts/org-node.contract';
import type { OrgTreeResponse } from '@/entities/org-node/api/fetch-org-tree';
import { createOrgAggregates } from '@/entities/org-node/model/create-org-aggregates';
import { createOrgGraph } from '@/entities/org-node/model/create-org-graph';
import { queryKeys } from '@/shared/api/query-keys';
import { useOrgTreeEvents } from './useOrgTreeEvents';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  readonly listeners = new Map<string, Array<(event: Event) => void>>();
  closed = false;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public readonly url: string) { FakeEventSource.instances.push(this); }
  addEventListener(type: string, listener: (event: Event) => void) { this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]); }
  close() { this.closed = true; }
  emit(type: string, payload: unknown) {
    const event = new MessageEvent(type, { data: JSON.stringify(payload) });
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

const nodes: OrgNode[] = [{ id: 'root', name: 'Root', parentId: null, headcount: 1, budget: 100, performance: 50, updatedAt: '2026-01-01T00:00:00.000Z' }];
let container: HTMLDivElement;
let root: Root;

function data(): OrgTreeResponse {
  const graph = createOrgGraph(nodes);
  return { graph, aggregates: createOrgAggregates(graph), revision: 1 };
}

function Harness({ onPatch, onRecover }: { onPatch: (nodeId: string, revision: number) => void; onRecover: () => Promise<unknown> }) {
  useOrgTreeEvents({ revision: 1, onPatch, onRecover });
  return null;
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  FakeEventSource.instances = [];
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function render() {
  vi.stubGlobal('EventSource', FakeEventSource);
  const client = new QueryClient();
  client.setQueryData(queryKeys.orgTree, data());
  const onPatch = vi.fn();
  const onRecover = vi.fn().mockResolvedValue(undefined);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<QueryClientProvider client={client}><Harness onPatch={onPatch} onRecover={onRecover} /></QueryClientProvider>));
  return { client, onPatch, onRecover, source: FakeEventSource.instances[0] };
}

describe('useOrgTreeEvents', () => {
  it('applies sequential patches and ignores duplicates', () => {
    const { client, onPatch, source } = render();
    const patch = { type: 'org-node.patch', revision: 2, nodeId: 'root', updatedAt: '2026-01-02T00:00:00.000Z', changes: { headcount: 3 } };
    act(() => source.emit('org-node.patch', patch));
    expect(client.getQueryData<OrgTreeResponse>(queryKeys.orgTree)?.graph.nodesById.get('root')?.headcount).toBe(3);
    act(() => source.emit('org-node.patch', patch));
    expect(onPatch).toHaveBeenCalledTimes(1);
  });

  it('recovers when a revision is missed and closes on unmount', async () => {
    const { onRecover, source } = render();
    act(() => source.emit('org-node.patch', { type: 'org-node.patch', revision: 3, nodeId: 'root', updatedAt: '2026-01-02T00:00:00.000Z', changes: { headcount: 3 } }));
    expect(onRecover).toHaveBeenCalledTimes(1);
    await act(async () => undefined);
    act(() => root.unmount());
    expect(source.closed).toBe(true);
  });

  it('reconnects with exponential backoff after a transport error', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    const { source } = render();
    act(() => source.onerror?.());
    expect(source.closed).toBe(true);
    act(() => vi.advanceTimersByTime(999));
    expect(FakeEventSource.instances).toHaveLength(1);
    act(() => vi.advanceTimersByTime(1));
    expect(FakeEventSource.instances).toHaveLength(2);
  });
});
