import styled from 'styled-components';

const Badge = styled.span<{ $value: number }>`
  display: inline-flex; align-items: center; gap: 6px; font-variant-numeric: tabular-nums; font-weight: 700;
  color: ${({ $value }) => ($value < 50 ? '#b42318' : $value < 80 ? '#9a6700' : '#067647')};
  &::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
`;
export function PerformanceIndicator({ value }: { value: number }) { return <Badge $value={value}>{value.toFixed(0)}%</Badge>; }
