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
export const orgNodePatchSchema = z.object({
  type: z.literal('org-node.patch'),
  revision: z.number().int().nonnegative(),
  nodeId: z.string().trim().min(1),
  updatedAt: z.string().datetime({ offset: true }),
  changes: z.object({
    headcount: z.number().int().nonnegative().optional(),
    budget: z.number().finite().nonnegative().optional(),
    performance: z.number().finite().min(0).max(100).optional()
  }).refine((changes) => Object.keys(changes).length > 0, 'At least one metric must change')
});
export type OrgNode = z.infer<typeof orgNodeSchema>;
export type OrgNodePatch = z.infer<typeof orgNodePatchSchema>;
