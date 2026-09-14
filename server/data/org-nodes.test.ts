import { describe, expect, it } from 'vitest';
import { orgNodes } from './org-nodes.js';

describe('organization fixture', () => {
  it('has 52 valid flat nodes with four roots and three levels', () => {
    expect(orgNodes).toHaveLength(52);
    expect(orgNodes.filter((node) => node.parentId === null)).toHaveLength(4);
    const ids = new Set(orgNodes.map((node) => node.id));
    expect(ids.size).toBe(52);
    expect(orgNodes.every((node) => node.parentId === null || ids.has(node.parentId))).toBe(true);
    const maximumDepth = Math.max(...orgNodes.map((node) => node.id.split('-').includes('team') ? 3 : node.id.split('-').includes('department') ? 2 : 1));
    expect(maximumDepth).toBe(3);
  });
});
