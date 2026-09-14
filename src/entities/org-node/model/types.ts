import type { OrgNode } from '../../../../shared/contracts/org-node.contract';

export type NodeId = string;
export type OrgGraph = {
  nodesById: Map<NodeId, OrgNode>;
  parentById: Map<NodeId, NodeId | null>;
  childrenByParent: Map<NodeId | null, NodeId[]>;
  rootIds: NodeId[];
  levelById: Map<NodeId, number>;
  orderedIds: NodeId[];
};
