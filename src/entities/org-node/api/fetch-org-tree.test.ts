import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, fetchOrgTree } from './fetch-org-tree';

const signal = new AbortController().signal;
const validNode = {
  id: 'root', name: 'Root', parentId: null, headcount: 1, budget: 1, performance: 50, updatedAt: '2026-01-01T00:00:00.000Z'
};

afterEach(() => vi.unstubAllGlobals());

describe('fetchOrgTree', () => {
  it('turns HTTP failures into API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(fetchOrgTree({ signal })).rejects.toThrow(new ApiError('Не удалось загрузить структуру: HTTP 503'));
  });

  it('rejects malformed JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{', { headers: { 'Content-Type': 'application/json' } })));
    await expect(fetchOrgTree({ signal })).rejects.toThrow('Сервер вернул некорректный JSON');
  });

  it('rejects an invalid DTO and revision', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{ ...validNode, id: '' }]), { headers: { 'X-Org-Revision': '1' } })));
    await expect(fetchOrgTree({ signal })).rejects.toThrow('Сервер вернул некорректные данные');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([validNode]), { headers: { 'X-Org-Revision': 'not-a-number' } })));
    await expect(fetchOrgTree({ signal })).rejects.toThrow('Сервер не указал корректную ревизию данных');
  });

  it('passes the abort signal through without converting cancellation to an API error', async () => {
    const controller = new AbortController();
    const cancelled = new DOMException('The operation was aborted.', 'AbortError');
    const mockedFetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(cancelled), { once: true });
    }));
    vi.stubGlobal('fetch', mockedFetch);
    const request = fetchOrgTree({ signal: controller.signal });
    controller.abort();
    await expect(request).rejects.toBe(cancelled);
    expect(mockedFetch).toHaveBeenCalledWith('/api/org-tree', { signal: controller.signal });
  });
});
