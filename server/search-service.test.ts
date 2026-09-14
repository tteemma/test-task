import { describe, expect, it } from 'vitest';
import { createDemoSearchInterpreter } from './search-service.js';

describe('demo search interpreter', () => {
  const interpreter = createDemoSearchInterpreter();

  it('uses a plain query as a name filter', async () => {
    await expect(interpreter.interpret('  Отдел   продаж ')).resolves.toMatchObject({ name: 'Отдел продаж', levels: null });
  });

  it('extracts supported structured conditions', async () => {
    await expect(interpreter.interpret('уровень 2 от 20 человек эффективность от 75% сортируй по бюджету по убыванию')).resolves.toMatchObject({
      name: null, levels: [2], headcountMin: 20, performanceMin: 75, sort: { field: 'budget', direction: 'desc' }
    });
  });
});
