import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import type { OrgGraph, NodeId } from '@/entities/org-node/model/types';
import { OrgTreeNode } from '@/entities/org-node/ui/OrgTreeNode';

const Tree = styled.ul`margin: 0; padding: 0;`;
type Props = { graph: OrgGraph; selectedId: NodeId | null; onSelect: (id: NodeId) => void };
export function OrgTree({ graph, selectedId, onSelect }: Props) {
  const [expandedIds, setExpandedIds] = useState(() => new Set(graph.rootIds.filter((id) => (graph.childrenByParent.get(id)?.length ?? 0) > 0)));
  const toggle = useCallback((id: NodeId) => setExpandedIds((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }), []);
  useEffect(() => {
    if (!selectedId) return;
    setExpandedIds((previous) => {
      const next = new Set(previous);
      let current = graph.parentById.get(selectedId);
      while (current) {
        next.add(current);
        current = graph.parentById.get(current);
      }
      return next;
    });
  }, [graph, selectedId]);
  return <Tree aria-label="Структура организации">{graph.rootIds.map((id) => <OrgTreeNode key={id} id={id} graph={graph} expandedIds={expandedIds} selectedId={selectedId} onToggle={toggle} onSelect={onSelect} />)}</Tree>;
}
