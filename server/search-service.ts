import { emptyOrgSearchFilter, orgSearchFilterSchema, type OrgSearchFilter } from '../shared/contracts/org-search.contract.js';

/**
 * Boundary for a future Responses API adapter. The current adapter is local and
 * deterministic, so the product works without an API key or external request.
 */
export type SearchInterpreter = { interpret(query: string): Promise<OrgSearchFilter> };

export function createDemoSearchInterpreter(): SearchInterpreter {
  return {
    async interpret(query) {
      const filter = emptyOrgSearchFilter();
      const normalized = query.trim().replace(/\s+/g, ' ');
      const level = normalized.match(/уров(?:ень|ня)\s*([123])/iu);
      const peopleMin = normalized.match(/(?:от|больше)\s*(\d+)\s*(?:чел(?:овек)?|сотрудник)/iu);
      const peopleMax = normalized.match(/(?:до|меньше)\s*(\d+)\s*(?:чел(?:овек)?|сотрудник)/iu);
      const performanceMin = normalized.match(/(?:эффективност[ьи]\s*(?:от|больше)?|от)\s*(\d+(?:[.,]\d+)?)\s*%/iu);
      const sort = normalized.match(/сортир(?:уй|овка)?\s+(?:по\s+)?(названию|уровню|численности|бюджету|эффективности)\s*(по убыванию|по возрастанию)?/iu);
      if (level) filter.levels = [Number(level[1]) as 1 | 2 | 3];
      if (peopleMin) filter.headcountMin = Number(peopleMin[1]);
      if (peopleMax) filter.headcountMax = Number(peopleMax[1]);
      if (performanceMin) filter.performanceMin = Number(performanceMin[1].replace(',', '.'));
      if (sort) {
        const fields = { названию: 'name', уровню: 'level', численности: 'headcount', бюджету: 'budget', эффективности: 'performance' } as const;
        filter.sort = { field: fields[sort[1].toLocaleLowerCase('ru-RU') as keyof typeof fields], direction: /убыванию/iu.test(sort[2] ?? '') ? 'desc' : 'asc' };
      }
      const hasStructuredCondition = Boolean(level || peopleMin || peopleMax || performanceMin || sort);
      if (!hasStructuredCondition) filter.name = normalized;
      return orgSearchFilterSchema.parse(filter);
    }
  };
}
