import { describe, expect, it, vi } from 'vitest';
import type { OrgNode } from '../shared/contracts/org-node.contract.js';
import { OrgStore } from './org-store.js';

const nodes: OrgNode[] = [{ id: 'root', name: 'Root', parentId: null, headcount: 1, budget: 100, performance: 50, updatedAt: '2026-01-01T00:00:00.000Z' }];

describe('OrgStore', () => {
  it('creates sequential minimal patches and does not emit no-ops', () => {
    const store = new OrgStore(nodes, { clock: () => new Date('2026-01-02T00:00:00.000Z') });
    const listener = vi.fn();
    store.subscribe(1, listener);
    expect(store.applyPatch('root', { headcount: 1 })).toBeNull();
    const patch = store.applyPatch('root', { headcount: 2 });
    expect(patch).toMatchObject({ revision: 2, nodeId: 'root', changes: { headcount: 2 }, updatedAt: '2026-01-02T00:00:00.000Z' });
    expect(listener).toHaveBeenCalledWith(patch);
    expect(store.getSnapshot()).toMatchObject({ revision: 2 });
  });

  it('replays retained patches and requires sync beyond the buffer', () => {
    const store = new OrgStore(nodes, { bufferSize: 2 });
    store.applyPatch('root', { headcount: 2 });
    store.applyPatch('root', { headcount: 3 });
    store.applyPatch('root', { headcount: 4 });
    const replay = vi.fn();
    store.subscribe(2, replay);
    expect(replay.mock.calls.map(([event]) => event.revision)).toEqual([3, 4]);
    const stale = vi.fn();
    store.subscribe(1, stale);
    expect(stale).toHaveBeenCalledWith({ type: 'sync-required', revision: 4 });
  });

  it('simulates a non-no-op patch with injected random source', () => {
    const store = new OrgStore(nodes, { random: () => 0 });
    expect(store.simulatePatch()).toMatchObject({ changes: { headcount: 0 }, revision: 2 });
  });
});
