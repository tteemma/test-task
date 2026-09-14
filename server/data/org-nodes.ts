import type { OrgNode } from '../../shared/contracts/org-node.contract.js';

const divisions = ['Корпоративные решения', 'Клиентский опыт', 'Технологии', 'Финансы и операции'];
const departments = ['Стратегия', 'Развитие', 'Поддержка'];
const teams = ['Альфа', 'Бета', 'Гамма'];
const stamp = (index: number) => new Date(Date.UTC(2026, 0, 1, 8, index, 0)).toISOString();

export const orgNodes: OrgNode[] = divisions.flatMap((division, divisionIndex) => {
  const rootId = `division-${divisionIndex + 1}`;
  const root: OrgNode = { id: rootId, name: division, parentId: null, headcount: 8 + divisionIndex * 3, budget: 8_000_000 + divisionIndex * 1_300_000, performance: 69 + divisionIndex * 7, updatedAt: stamp(divisionIndex) };
  const children = departments.flatMap((department, departmentIndex) => {
    const departmentId = `${rootId}-department-${departmentIndex + 1}`;
    const departmentNode: OrgNode = { id: departmentId, name: `${department} — ${division}`, parentId: rootId, headcount: 3 + departmentIndex + divisionIndex, budget: 1_400_000 + departmentIndex * 350_000, performance: 55 + ((divisionIndex * 13 + departmentIndex * 11) % 42), updatedAt: stamp(10 + divisionIndex * 12 + departmentIndex) };
    const teamNodes = teams.map((team, teamIndex): OrgNode => ({
      id: `${departmentId}-team-${teamIndex + 1}`,
      name: `Команда ${team} — ${department}`,
      parentId: departmentId,
      headcount: divisionIndex === 0 && departmentIndex === 0 && teamIndex === 0 ? 0 : 2 + ((divisionIndex + departmentIndex + teamIndex) % 6),
      budget: 350_000 + (divisionIndex * 90_000) + (departmentIndex * 40_000) + teamIndex * 30_000,
      performance: 42 + ((divisionIndex * 17 + departmentIndex * 9 + teamIndex * 13) % 56),
      updatedAt: stamp(20 + divisionIndex * 12 + departmentIndex * 3 + teamIndex)
    }));
    return [departmentNode, ...teamNodes];
  });
  return [root, ...children];
});
