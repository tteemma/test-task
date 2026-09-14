import type { OrgNodePatch } from '../../../../shared/contracts/org-node.contract';
import type { OrgTreeResponse } from '../api/fetch-org-tree';
import type { OrgAggregate, NodeId } from './types';

function aggregateNode(data: OrgTreeResponse, aggregates: Map<NodeId, OrgAggregate>, id: NodeId): OrgAggregate | null {
  const node = data.graph.nodesById.get(id);
  if (!node) return null;
  let totalHeadcount = node.headcount;
  let totalBudget = node.budget;
  let weightedTotal = node.performance * node.headcount;
  for (const childId of data.graph.childrenByParent.get(id) ?? []) {
    const child = aggregates.get(childId);
    if (!child) continue;
    totalHeadcount += child.totalHeadcount;
    totalBudget += child.totalBudget;
    weightedTotal += (child.weightedPerformance ?? 0) * child.totalHeadcount;
  }
  return { nodeId: id, level: data.graph.levelById.get(id) ?? 1, totalHeadcount, totalBudget, weightedPerformance: totalHeadcount === 0 ? null : weightedTotal / totalHeadcount };
}

/** Applies a metric-only patch and recomputes only the edited node's ancestor chain. */
export function applyOrgNodePatch(data: OrgTreeResponse, patch: OrgNodePatch): OrgTreeResponse | null {
  const current = data.graph.nodesById.get(patch.nodeId);
  if (!current) return null;
  const nodesById = new Map(data.graph.nodesById);
  nodesById.set(patch.nodeId, { ...current, ...patch.changes, updatedAt: patch.updatedAt });
  const graph = { ...data.graph, nodesById };
  const next = { ...data, graph, aggregates: new Map(data.aggregates), revision: patch.revision };
  let currentId: NodeId | null = patch.nodeId;
  while (currentId) {
    const aggregate = aggregateNode(next, next.aggregates, currentId);
    if (!aggregate) return null;
    next.aggregates.set(currentId, aggregate);
    currentId = graph.parentById.get(currentId) ?? null;
  }
  return next;
}
