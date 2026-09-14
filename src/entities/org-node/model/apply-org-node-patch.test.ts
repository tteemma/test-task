import { describe, expect, it } from 'vitest';
import type { OrgNode } from '../../../../shared/contracts/org-node.contract';
import { createOrgAggregates } from './create-org-aggregates';
import { createOrgGraph } from './create-org-graph';
import { applyOrgNodePatch } from './apply-org-node-patch';

const nodes: OrgNode[] = [
  { id: 'root', name: 'Root', parentId: null, headcount: 2, budget: 20, performance: 50, updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'child', name: 'Child', parentId: 'root', headcount: 3, budget: 30, performance: 80, updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'other', name: 'Other', parentId: null, headcount: 4, budget: 40, performance: 90, updatedAt: '2026-01-01T00:00:00.000Z' }
];

describe('applyOrgNodePatch', () => {
  it('immutably updates the node and its ancestors only', () => {
    const graph = createOrgGraph(nodes);
    const data = { graph, aggregates: createOrgAggregates(graph), revision: 1 };
    const result = applyOrgNodePatch(data, { type: 'org-node.patch', revision: 2, nodeId: 'child', updatedAt: '2026-01-02T00:00:00.000Z', changes: { headcount: 5, performance: 60 } });
    expect(result?.graph.nodesById.get('child')).toMatchObject({ headcount: 5, performance: 60 });
    expect(result?.aggregates.get('root')).toMatchObject({ totalHeadcount: 7, totalBudget: 50, weightedPerformance: expect.closeTo(57.142857, 5) });
    expect(result?.aggregates.get('other')).toBe(data.aggregates.get('other'));
    expect(data.graph.nodesById.get('child')?.headcount).toBe(3);
  });
});
