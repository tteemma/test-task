import { memo, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';
import type { OrgGraph, NodeId } from '../model/types';
import { PerformanceIndicator } from './PerformanceIndicator';

const Item = styled.li<{ $level: number; $expanded: boolean }>`
  list-style: none; margin: 4px 0 ${({ $expanded }) => $expanded ? '4px' : '0'}; padding-left: ${({ $level }) => ($level - 1) * 18}px;
`;
const Row = styled.div<{ $selected: boolean }>`
  width: 100%; border: 1px solid ${({ $selected }) => ($selected ? '#2563eb' : 'transparent')}; border-radius: 8px; background: ${({ $selected }) => ($selected ? '#dbeafe' : 'transparent')};
  color: inherit; display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 8px; align-items: stretch; padding: 4px;
  &:hover { background: ${({ $selected }) => ($selected ? '#dbeafe' : '#eef2ff')}; }
`;
const Toggle = styled.button`
  align-items: center; align-self: center; background: transparent; border: 0; border-radius: 6px; color: #475569; cursor: pointer; display: inline-flex; height: 28px; justify-content: center; padding: 0; width: 28px;
  &:hover { background: #e2e8f0; color: #1e293b; }
  svg { height: 18px; transition: transform 180ms ease; width: 18px; }
  @media (prefers-reduced-motion: reduce) { svg { transition: none; } }
`;
const Spacer = styled.span`align-self: center; color: #cbd5e1; display: grid; height: 28px; place-items: center; width: 28px;`;
const Select = styled.button`
  background: transparent; border: 0; color: inherit; cursor: pointer; display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr) 70px 58px; min-width: 0; padding: 6px; text-align: left;
  &:focus-visible { outline: 3px solid #3b82f6; outline-offset: -2px; border-radius: 5px; }
`;
const Name = styled.span`font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;
const Metric = styled.span`font-size: 13px; color: #475569; font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap;`;
const Children = styled.ul`margin: 0; padding: 0;`;
const Expand = styled.div<{ $height: number }>`
  height: ${({ $height }) => `${$height}px`}; overflow: hidden; transition: height 180ms ease;
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;
const flash = keyframes`from { background: #fef3c7; } to { background: transparent; }`;
const ChangedMetric = styled.span`animation: ${flash} 1.5s ease-out; border-radius: 3px;`;
const ChevronIcon = styled.svg<{ $open: boolean }>`
  height: 18px;
  transform: ${({ $open }) => $open ? 'rotate(90deg)' : 'rotate(0deg)'};
  transition: transform 180ms ease;
  width: 18px;
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;
function Chevron({ open }: { open: boolean }) {
  return <ChevronIcon $open={open} viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></ChevronIcon>;
}

type Props = { id: NodeId; graph: OrgGraph; expandedIds: Set<NodeId>; selectedId: NodeId | null; onToggle: (id: NodeId) => void; onSelect: (id: NodeId) => void; highlightedRevisions: Map<NodeId, number> };
function Collapsible({ open, children }: { open: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    if (open) setMounted(true);
    else {
      setHeight(0);
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setMounted(false);
    }
  }, [open]);
  useLayoutEffect(() => {
    if (mounted) setHeight(open ? ref.current?.scrollHeight ?? 0 : 0);
  }, [children, mounted, open]);
  return <Expand ref={ref} $height={height} aria-hidden={!open} onTransitionEnd={() => { if (!open) setMounted(false); }}>{mounted && <Children>{children}</Children>}</Expand>;
}
export const OrgTreeNode = memo(function OrgTreeNode({ id, graph, expandedIds, selectedId, onToggle, onSelect, highlightedRevisions }: Props) {
  const node = graph.nodesById.get(id);
  const children = graph.childrenByParent.get(id) ?? [];
  if (!node) return null;
  const expandable = children.length > 0;
  const expanded = expandedIds.has(id);
  const revision = highlightedRevisions.get(id);
  const changed = (value: ReactNode) => revision ? <ChangedMetric key={revision}>{value}</ChangedMetric> : value;
  return <Item $level={graph.levelById.get(id) ?? 1} $expanded={expanded}>
    <Row $selected={selectedId === id}>
      {expandable ? <Toggle type="button" onClick={() => onToggle(id)} aria-expanded={expanded} aria-label={`${expanded ? 'Свернуть' : 'Развернуть'} ${node.name}`}><Chevron open={expanded} /></Toggle> : <Spacer aria-hidden="true">•</Spacer>}
      <Select type="button" onClick={() => onSelect(id)} aria-pressed={selectedId === id} aria-label={`Выбрать ${node.name}`}>
        <Name>{changed(node.name)}</Name><Metric>{changed(`${node.headcount} чел.`)}</Metric>{changed(<PerformanceIndicator value={node.performance} />)}
      </Select>
    </Row>
    {expandable && <Collapsible open={expanded}>{children.map((childId) => <OrgTreeNode key={childId} id={childId} graph={graph} expandedIds={expandedIds} selectedId={selectedId} onToggle={onToggle} onSelect={onSelect} highlightedRevisions={highlightedRevisions} />)}</Collapsible>}
  </Item>;
});
