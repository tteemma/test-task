import type { OrgAggregate, OrgGraph, NodeId } from './types';

type Accumulator = { headcount: number; budget: number; weightedPerformanceTotal: number };

/** Builds subtree metrics in post-order without changing graph nodes or their order. */
export function createOrgAggregates(graph: OrgGraph): Map<NodeId, OrgAggregate> {
  const accumulators = new Map<NodeId, Accumulator>();
  const aggregates = new Map<NodeId, OrgAggregate>();
  const stack = graph.rootIds.map((id) => ({ id, visited: false })).reverse();

  while (stack.length > 0) {
    const entry = stack.pop();
    if (!entry) continue;
    if (!entry.visited) {
      stack.push({ ...entry, visited: true });
      const children = graph.childrenByParent.get(entry.id) ?? [];
      for (let index = children.length - 1; index >= 0; index -= 1) stack.push({ id: children[index], visited: false });
      continue;
    }

    const node = graph.nodesById.get(entry.id);
    if (!node) continue;
    const own: Accumulator = {
      headcount: node.headcount,
      budget: node.budget,
      weightedPerformanceTotal: node.performance * node.headcount
    };
    for (const childId of graph.childrenByParent.get(entry.id) ?? []) {
      const child = accumulators.get(childId);
      if (!child) continue;
      own.headcount += child.headcount;
      own.budget += child.budget;
      own.weightedPerformanceTotal += child.weightedPerformanceTotal;
    }
    accumulators.set(entry.id, own);
    aggregates.set(entry.id, {
      nodeId: entry.id,
      level: graph.levelById.get(entry.id) ?? 1,
      totalHeadcount: own.headcount,
      totalBudget: own.budget,
      weightedPerformance: own.headcount === 0 ? null : own.weightedPerformanceTotal / own.headcount
    });
  }
  return aggregates;
}
