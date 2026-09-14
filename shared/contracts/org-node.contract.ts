import { z } from 'zod';

export const orgNodeSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  parentId: z.string().trim().min(1).nullable(),
  headcount: z.number().int().nonnegative(),
  budget: z.number().int().finite().nonnegative(),
  performance: z.number().finite().min(0).max(100),
  updatedAt: z.string().datetime({ offset: true })
});

export const orgTreeSchema = z.array(orgNodeSchema);
export type OrgNode = z.infer<typeof orgNodeSchema>;
