import { orgTreeSchema } from '../../../../shared/contracts/org-node.contract';
import { createOrgGraph } from '../model/create-org-graph';
import type { OrgGraph } from '../model/types';

export class ApiError extends Error {}
export type OrgTreeResponse = { graph: OrgGraph; revision: number };

export async function fetchOrgTree({ signal }: { signal: AbortSignal }): Promise<OrgTreeResponse> {
  const response = await fetch('/api/org-tree', { signal });
  if (!response.ok) throw new ApiError(`Не удалось загрузить структуру: HTTP ${response.status}`);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('Сервер вернул некорректный JSON');
  }

  const parsed = orgTreeSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(`Сервер вернул некорректные данные: ${parsed.error.issues[0]?.message ?? 'unknown error'}`);
  const revision = Number(response.headers.get('X-Org-Revision'));
  if (!Number.isInteger(revision) || revision < 0) throw new ApiError('Сервер не указал корректную ревизию данных');
  try {
    return { graph: createOrgGraph(parsed.data), revision };
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Некорректный граф организации');
  }
}
