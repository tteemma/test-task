import type { OrgNode } from '../../../../shared/contracts/org-node.contract';
import type { OrgGraph, NodeId } from './types';

export class OrgGraphError extends Error {}

export function createOrgGraph(nodes: OrgNode[]): OrgGraph {
  const nodesById = new Map<NodeId, OrgNode>();
  const childrenByParent = new Map<NodeId | null, NodeId[]>([[null, []]]);
  const parentById = new Map<NodeId, NodeId | null>();

  for (const node of nodes) {
    if (nodesById.has(node.id)) throw new OrgGraphError(`Duplicate node id: ${node.id}`);
    nodesById.set(node.id, node);
    childrenByParent.set(node.id, []);
  }
  for (const node of nodes) {
    parentById.set(node.id, node.parentId);
    if (node.parentId !== null && !nodesById.has(node.parentId)) throw new OrgGraphError(`Unknown parent for ${node.id}`);
    if (node.parentId === node.id) throw new OrgGraphError(`Node ${node.id} cannot be its own parent`);
    childrenByParent.get(node.parentId)?.push(node.id);
  }

  const rootIds = childrenByParent.get(null) ?? [];
  const levelById = new Map<NodeId, number>();
  const visiting = new Set<NodeId>();
  const visit = (id: NodeId, level: number): void => {
    if (visiting.has(id)) throw new OrgGraphError(`Cycle detected at ${id}`);
    if (levelById.has(id)) return;
    visiting.add(id);
    levelById.set(id, level);
    for (const childId of childrenByParent.get(id) ?? []) visit(childId, level + 1);
    visiting.delete(id);
  };
  for (const rootId of rootIds) visit(rootId, 1);
  if (levelById.size !== nodes.length) {
    for (const id of nodesById.keys()) {
      if (!levelById.has(id)) visit(id, 1);
    }
    throw new OrgGraphError('Graph contains an unreachable node');
  }

  return { nodesById, parentById, childrenByParent, rootIds, levelById, orderedIds: nodes.map(({ id }) => id) };
}
