import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';

const servers: Server[] = [];

async function request(app = createApp({ delayMs: 0 }), path = '/api/org-tree') {
  const server = app.listen(0, '127.0.0.1');
  servers.push(server);
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  return fetch(`http://127.0.0.1:${port}${path}`);
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
