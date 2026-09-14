import { app, orgStore } from './app.js';

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`Mock API is listening on http://localhost:${port}`));
const updateIntervalMs = Number(process.env.LIVE_UPDATE_MS ?? 5_000);
if (updateIntervalMs > 0) setInterval(() => orgStore.simulatePatch(), updateIntervalMs);
