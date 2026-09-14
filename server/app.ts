import express from 'express';
import { orgNodes } from './data/org-nodes.js';

export const app = express();
app.get('/api/org-tree', async (_request, response) => {
  const delay = Number(process.env.MOCK_DELAY_MS ?? 400);
  if (delay > 0) await new Promise<void>((resolve) => setTimeout(resolve, delay));
  response.setHeader('X-Org-Revision', '1').json(orgNodes);
});
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
