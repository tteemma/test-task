import { describe, expect, it } from 'vitest';
import type { OrgNode } from '../../../../shared/contracts/org-node.contract';
import { createOrgGraph } from './create-org-graph';
import { createOrgAggregates } from './create-org-aggregates';

const node = (id: string, parentId: string | null, headcount: number, budget: number, performance: number): OrgNode => ({
  id, parentId, headcount, budget, performance, name: id, updatedAt: '2026-01-01T00:00:00.000Z'
});

describe('createOrgAggregates', () => {
  it('returns an empty map for an empty graph', () => {
    expect(createOrgAggregates(createOrgGraph([]))).toEqual(new Map());
  });

  it('keeps a single node metrics and level', () => {
    const aggregate = createOrgAggregates(createOrgGraph([node('root', null, 4, 500, 75)])).get('root');
    expect(aggregate).toMatchObject({ nodeId: 'root', level: 1, totalHeadcount: 4, totalBudget: 500, weightedPerformance: 75 });
  });

  it('sums a multi-level subtree and uses weighted performance', () => {
    const input = [node('root', null, 2, 100, 50), node('team', 'root', 3, 200, 80), node('leaf', 'team', 5, 300, 100)];
    const aggregates = createOrgAggregates(createOrgGraph(input));
    expect(aggregates.get('team')).toMatchObject({ level: 2, totalHeadcount: 8, totalBudget: 500, weightedPerformance: 92.5 });
    expect(aggregates.get('root')).toMatchObject({ level: 1, totalHeadcount: 10, totalBudget: 600, weightedPerformance: 84 });
  });

  it('uses null performance for a zero-headcount subtree', () => {
    const aggregate = createOrgAggregates(createOrgGraph([node('root', null, 0, 12, 80)])).get('root');
    expect(aggregate?.weightedPerformance).toBeNull();
  });

  it('does not mutate input nodes', () => {
    const input = [node('root', null, 1, 2, 50), node('child', 'root', 2, 3, 70)];
    const snapshot = structuredClone(input);
    createOrgAggregates(createOrgGraph(input));
    expect(input).toEqual(snapshot);
  });
});
