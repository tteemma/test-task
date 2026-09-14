import { memo } from 'react';
import styled from 'styled-components';
import type { OrgGraph, NodeId } from '../model/types';
import { PerformanceIndicator } from './PerformanceIndicator';

const Item = styled.li<{ $level: number }>`list-style: none; margin: 4px 0; padding-left: ${({ $level }) => ($level - 1) * 18}px;`;
const Row = styled.div<{ $selected: boolean }>`
  width: 100%; border: 1px solid ${({ $selected }) => ($selected ? '#2563eb' : 'transparent')}; border-radius: 8px; background: ${({ $selected }) => ($selected ? '#dbeafe' : 'transparent')};
  color: inherit; display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 8px; align-items: stretch; padding: 4px;
  &:hover { background: ${({ $selected }) => ($selected ? '#dbeafe' : '#eef2ff')}; }
`;
const Toggle = styled.button`align-self: center; border: 0; background: transparent; cursor: pointer; font-size: 16px; line-height: 1; padding: 4px;`;
const Select = styled.button`
  background: transparent; border: 0; color: inherit; cursor: pointer; display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr) auto auto; min-width: 0; padding: 6px; text-align: left;
  &:focus-visible { outline: 3px solid #3b82f6; outline-offset: -2px; border-radius: 5px; }
`;
const Name = styled.span`font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;
const Metric = styled.span`font-size: 13px; color: #475569; white-space: nowrap;`;
const Children = styled.ul`margin: 0; padding: 0;`;

type Props = { id: NodeId; graph: OrgGraph; expandedIds: Set<NodeId>; selectedId: NodeId | null; onToggle: (id: NodeId) => void; onSelect: (id: NodeId) => void };
export const OrgTreeNode = memo(function OrgTreeNode({ id, graph, expandedIds, selectedId, onToggle, onSelect }: Props) {
  const node = graph.nodesById.get(id);
  const children = graph.childrenByParent.get(id) ?? [];
  if (!node) return null;
  const expandable = children.length > 0;
  const expanded = expandedIds.has(id);
  return <Item $level={graph.levelById.get(id) ?? 1}>
    <Row $selected={selectedId === id}>
      {expandable ? <Toggle type="button" onClick={() => onToggle(id)} aria-expanded={expanded} aria-label={`${expanded ? 'Свернуть' : 'Развернуть'} ${node.name}`}>{expanded ? '▾' : '▸'}</Toggle> : <Toggle as="span" aria-hidden="true">•</Toggle>}
      <Select type="button" onClick={() => onSelect(id)} aria-pressed={selectedId === id} aria-label={`Выбрать ${node.name}`}>
        <Name>{node.name}</Name><Metric>{node.headcount} чел.</Metric><PerformanceIndicator value={node.performance} />
      </Select>
    </Row>
    {expandable && expanded && <Children>{children.map((childId) => <OrgTreeNode key={childId} id={childId} graph={graph} expandedIds={expandedIds} selectedId={selectedId} onToggle={onToggle} onSelect={onSelect} />)}</Children>}
  </Item>;
});
