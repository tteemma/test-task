import express from 'express';
import { orgNodes } from './data/org-nodes.js';
import type { OrgNode } from '../shared/contracts/org-node.contract.js';
import { orgSearchRequestSchema } from '../shared/contracts/org-search.contract.js';
import { OrgStore } from './org-store.js';
import { createDemoSearchInterpreter, type SearchInterpreter } from './search-service.js';

type AppOptions = {
  nodes?: readonly OrgNode[];
  revision?: number;
  delayMs?: number;
  heartbeatMs?: number;
  store?: OrgStore;
  searchInterpreter?: SearchInterpreter;
};

export function createApp({
  nodes = orgNodes,
  revision = 1,
  delayMs = Number(process.env.MOCK_DELAY_MS ?? 400),
  heartbeatMs = 15_000,
  store = new OrgStore(nodes, { revision }),
  searchInterpreter = createDemoSearchInterpreter()
}: AppOptions = {}) {
  const app = express();
  app.use(express.json({ limit: '2kb' }));
  app.get('/api/org-tree', async (_request, response) => {
    if (delayMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    const snapshot = store.getSnapshot();
    response.setHeader('X-Org-Revision', String(snapshot.revision)).json(snapshot.nodes);
  });
  app.get('/api/org-tree/events', (request, response) => {
    const since = Number(request.query.since ?? request.header('Last-Event-ID') ?? 0);
    response.status(200).set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    });
    response.flushHeaders();
    const write = (event: { type: string; revision: number }) => {
      response.write(`id: ${event.revision}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    };
    const unsubscribe = store.subscribe(Number.isInteger(since) && since >= 0 ? since : 0, write);
    const heartbeat = setInterval(() => response.write(': heartbeat\n\n'), heartbeatMs);
    let closed = false;
    const cleanup = () => {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      unsubscribe();
    };
    request.on('close', cleanup);
    response.on('close', cleanup);
  });
  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
  app.post('/api/search/interpret', async (request, response) => {
    const parsed = orgSearchRequestSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: 'Запрос должен содержать строку query длиной до 300 символов' });
    try {
      return response.json(await searchInterpreter.interpret(parsed.data.query));
    } catch {
      return response.status(503).json({ error: 'AI-интерпретация временно недоступна' });
    }
  });
  return app;
}

export const orgStore = new OrgStore(orgNodes);
export const app = createApp({ store: orgStore });
