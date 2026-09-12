# SkyGuard AI Frontend

React + Vite frontend for the SkyGuard AI Automatic Weather Station Network.

## Local development

1. Install Node.js 20+.
2. Run `npm install`.
3. Make sure `frontend/.env` contains:

```env
VITE_API_URL=http://localhost:3000
```

4. Start with `npm run dev`.

The frontend keeps the existing API/WebSocket integration. The dashboard redesign adds a black star-only background, transparent glass panels, three simultaneous telemetry charts, glittering/glowing station lines, and a three-column station network below the charts.

## Production build

```bash
npm run build
```
