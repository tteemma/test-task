import express from 'express';
import { orgNodes } from './data/org-nodes.js';
import type { OrgNode } from '../shared/contracts/org-node.contract.js';

type AppOptions = {
  nodes?: readonly OrgNode[];
  revision?: number;
  delayMs?: number;
};

export function createApp({
  nodes = orgNodes,
  revision = 1,
  delayMs = Number(process.env.MOCK_DELAY_MS ?? 400)
}: AppOptions = {}) {
  const app = express();
  app.get('/api/org-tree', async (_request, response) => {
    if (delayMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    response.setHeader('X-Org-Revision', String(revision)).json(nodes);
  });
  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
  return app;
}

export const app = createApp();
