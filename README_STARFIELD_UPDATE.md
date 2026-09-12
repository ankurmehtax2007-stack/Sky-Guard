# SkyGuard AI — Starry Glass Dashboard Update

This frontend update implements the SkyGuard AI dashboard visual shown in the reference:

- Full-screen starry night background visible behind the UI.
- Transparent glassmorphism cards instead of opaque black panels.
- Six mission-control metric cards with icons.
- Three side-by-side telemetry charts.
- Neon/glowing telemetry lines with sparkle points.
- Automatic Weather Station Network directly below telemetry in a horizontal layout.
- Responsive behavior for smaller screens.
- Existing REST/WebSocket data flow is preserved.

## Run

```bash
npm install
npm run dev
```

The frontend still uses `VITE_API_URL=http://localhost:3000` from `.env`.
