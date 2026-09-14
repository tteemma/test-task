import { once } from 'node:events';
import { get } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { OrgStore } from './org-store.js';

const servers: Server[] = [];

async function request(app = createApp({ delayMs: 0 }), path = '/api/org-tree') {
  const server = app.listen(0, '127.0.0.1');
  servers.push(server);
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  return fetch(`http://127.0.0.1:${port}${path}`);
}

async function closeRawSse(app: ReturnType<typeof createApp>, path: string) {
  const server = app.listen(0, '127.0.0.1');
  servers.push(server);
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  await new Promise<void>((resolve, reject) => {
    const client = get(`http://127.0.0.1:${port}${path}`);
    client.once('error', reject);
    client.once('response', (response) => response.once('data', () => {
      response.destroy();
      resolve();
    }));
  });
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => server.close((error?: Error) => error ? reject(error) : resolve()))));
});

describe('GET /api/org-tree', () => {
  it('returns the documented status, contract and revision header', async () => {
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.headers.get('x-org-revision')).toBe('1');
    const body: unknown = await response.json();
    expect(body).toHaveLength(52);
    expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ id: expect.any(String), parentId: expect.anything(), headcount: expect.any(Number) })]));
  });

  it('returns a valid empty collection', async () => {
    const response = await request(createApp({ nodes: [], revision: 7, delayMs: 0 }));
    expect(response.status).toBe(200);
    expect(response.headers.get('x-org-revision')).toBe('7');
    expect(await response.json()).toEqual([]);
  });
});

describe('GET /api/org-tree/events', () => {
  it('streams a replayed SSE patch and removes the subscriber on close', async () => {
    const store = new OrgStore([{ id: 'root', name: 'Root', parentId: null, headcount: 1, budget: 100, performance: 50, updatedAt: '2026-01-01T00:00:00.000Z' }]);
    store.applyPatch('root', { headcount: 2 });
    const response = await request(createApp({ store, delayMs: 0 }), '/api/org-tree/events?since=1');
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(response.headers.get('cache-control')).toContain('no-cache');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('SSE response does not have a body');
    const first = await reader.read();
    const text = new TextDecoder().decode(first.value);
    expect(text).toContain('id: 2');
    expect(text).toContain('event: org-node.patch');
    expect(text).toContain('"headcount":2');
    await reader.cancel();
  });

  it('sends sync-required when requested revision is older than the replay buffer', async () => {
    const store = new OrgStore([{ id: 'root', name: 'Root', parentId: null, headcount: 1, budget: 100, performance: 50, updatedAt: '2026-01-01T00:00:00.000Z' }], { bufferSize: 1 });
    store.applyPatch('root', { headcount: 2 });
    store.applyPatch('root', { headcount: 3 });
    const response = await request(createApp({ store, delayMs: 0 }), '/api/org-tree/events?since=1');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('SSE response does not have a body');
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toContain('event: sync-required');
    await reader.cancel();
  });

  it('cleans up its store subscription when the SSE client disconnects', async () => {
    const store = new OrgStore([{ id: 'root', name: 'Root', parentId: null, headcount: 1, budget: 100, performance: 50, updatedAt: '2026-01-01T00:00:00.000Z' }]);
    store.applyPatch('root', { headcount: 2 });
    await closeRawSse(createApp({ store, delayMs: 0 }), '/api/org-tree/events?since=1');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(store.subscriberCount).toBe(0);
  });
});
