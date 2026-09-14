import { z } from 'zod';

const nullableNumber = z.number().finite().nonnegative().nullable();

export const orgSearchFilterSchema = z.object({
  name: z.string().trim().min(1).nullable(),
  levels: z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])).min(1).nullable(),
  headcountMin: nullableNumber,
  headcountMax: nullableNumber,
  budgetMin: nullableNumber,
  budgetMax: nullableNumber,
  performanceMin: z.number().finite().min(0).max(100).nullable(),
  performanceMax: z.number().finite().min(0).max(100).nullable(),
  sort: z.object({
    field: z.enum(['name', 'level', 'headcount', 'budget', 'performance']),
    direction: z.enum(['asc', 'desc'])
  }).nullable()
}).superRefine((filter, context) => {
  for (const [minKey, maxKey] of [['headcountMin', 'headcountMax'], ['budgetMin', 'budgetMax'], ['performanceMin', 'performanceMax']] as const) {
    const min = filter[minKey];
    const max = filter[maxKey];
    if (min !== null && max !== null && min > max) context.addIssue({ code: z.ZodIssueCode.custom, path: [maxKey], message: 'Maximum must not be less than minimum' });
  }
});

export const orgSearchRequestSchema = z.object({ query: z.string().trim().min(1).max(300) });
export type OrgSearchFilter = z.infer<typeof orgSearchFilterSchema>;

export const emptyOrgSearchFilter = (): OrgSearchFilter => ({
  name: null, levels: null, headcountMin: null, headcountMax: null,
  budgetMin: null, budgetMax: null, performanceMin: null, performanceMax: null, sort: null
});
