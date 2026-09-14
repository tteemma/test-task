import type { OrgNode, OrgNodePatch } from '../shared/contracts/org-node.contract.js';

type MetricChanges = OrgNodePatch['changes'];
type StoreOptions = { revision?: number; bufferSize?: number; clock?: () => Date; random?: () => number };

export class OrgStore {
  private readonly nodes = new Map<string, OrgNode>();
  private readonly patches: OrgNodePatch[] = [];
  private readonly listeners = new Set<(patch: OrgNodePatch) => void>();
  private readonly bufferSize: number;
  private readonly clock: () => Date;
  private readonly random: () => number;
  private revision: number;

  constructor(initialNodes: readonly OrgNode[], { revision = 1, bufferSize = 100, clock = () => new Date(), random = Math.random }: StoreOptions = {}) {
    this.revision = revision;
    this.bufferSize = bufferSize;
    this.clock = clock;
    this.random = random;
    for (const node of initialNodes) this.nodes.set(node.id, { ...node });
  }

  getSnapshot() { return { nodes: [...this.nodes.values()].map((node) => ({ ...node })), revision: this.revision }; }
  get subscriberCount() { return this.listeners.size; }

  subscribe(since: number, listener: (event: OrgNodePatch | { type: 'sync-required'; revision: number }) => void) {
    const oldestRevision = this.patches[0]?.revision;
    if ((oldestRevision !== undefined && since < oldestRevision - 1) || (oldestRevision === undefined && since < this.revision)) {
      listener({ type: 'sync-required', revision: this.revision });
      return () => undefined;
    }
    for (const patch of this.patches) if (patch.revision > since) listener(patch);
    const patchListener = (patch: OrgNodePatch) => listener(patch);
    this.listeners.add(patchListener);
    return () => this.listeners.delete(patchListener);
  }

  applyPatch(nodeId: string, changes: MetricChanges, updatedAt = this.clock().toISOString()): OrgNodePatch | null {
    const node = this.nodes.get(nodeId);
    if (!node || Object.keys(changes).length === 0) return null;
    const changed = Object.entries(changes).some(([key, value]) => node[key as keyof MetricChanges] !== value);
    if (!changed) return null;
    const patch: OrgNodePatch = { type: 'org-node.patch', revision: this.revision + 1, nodeId, updatedAt, changes };
    this.revision = patch.revision;
    this.nodes.set(nodeId, { ...node, ...changes, updatedAt });
    this.patches.push(patch);
    if (this.patches.length > this.bufferSize) this.patches.shift();
    for (const listener of this.listeners) listener(patch);
    return patch;
  }

  simulatePatch(): OrgNodePatch | null {
    const nodes = [...this.nodes.values()];
    if (nodes.length === 0) return null;
    const node = nodes[Math.floor(this.random() * nodes.length)] ?? nodes[0];
    const field = Math.floor(this.random() * 3);
    if (field === 0) return this.applyPatch(node.id, { headcount: node.headcount === 0 ? 1 : node.headcount + (this.random() < .5 ? -1 : 1) });
    if (field === 1) return this.applyPatch(node.id, { budget: node.budget === 0 ? 50_000 : node.budget + (this.random() < .5 ? -50_000 : 50_000) });
    const delta = node.performance === 0 ? 1 : node.performance === 100 ? -1 : this.random() < .5 ? -1 : 1;
    return this.applyPatch(node.id, { performance: node.performance + delta });
  }
}
