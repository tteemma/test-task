import { describe, expect, it } from 'vitest';
import { createOrgGraph, OrgGraphError } from './create-org-graph';
import type { OrgNode } from '../../../../shared/contracts/org-node.contract';

const node = (id: string, parentId: string | null): OrgNode => ({ id, name: id, parentId, headcount: 1, budget: 1, performance: 50, updatedAt: '2026-01-01T00:00:00.000Z' });

describe('createOrgGraph', () => {
  it('builds roots, children and levels in linear passes', () => {
    const graph = createOrgGraph([node('root', null), node('child', 'root'), node('leaf', 'child'), node('other', null)]);
    expect(graph.rootIds).toEqual(['root', 'other']);
    expect(graph.childrenByParent.get('root')).toEqual(['child']);
    expect(graph.levelById.get('leaf')).toBe(3);
  });
  it('accepts an empty graph', () => expect(createOrgGraph([]).rootIds).toEqual([]));
  it('rejects bad relations', () => {
    expect(() => createOrgGraph([node('a', null), node('a', null)])).toThrow(OrgGraphError);
    expect(() => createOrgGraph([node('a', 'missing')])).toThrow(OrgGraphError);
    expect(() => createOrgGraph([node('a', 'a')])).toThrow(OrgGraphError);
    expect(() => createOrgGraph([node('a', 'b'), node('b', 'a')])).toThrow(OrgGraphError);
  });
});
