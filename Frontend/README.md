# NIMbus Frontend — Connected Build

This build contains the modified React/Vite frontend for NIMbus AI. It is configured for the existing NIMbus Node/Express backend at `http://localhost:3000`.

## Included changes

- Removed the glitter/sparkle/glow treatment from dashboard telemetry graphs.
- Dashboard telemetry now uses clean normal lines and small data points.
- Replaced the 3D/night Earth globe treatment on the India fleet page with a normal flat India map while keeping the station points and live anomaly status.
- Removed the standalone AI Insights navigation/route because the AI/XAI diagnosis is already available in Live Monitoring / anomaly diagnosis.
- Removed the obsolete `viewer` role from the frontend role routing.
- Root URL now goes to Login instead of opening the dashboard directly.
- Role scope is derived from the backend `stationId` for engineer/operator views.
- Frontend REST base URL remains `http://localhost:3000` by default and can be changed with `VITE_API_URL`.

## Run

```cmd
cd Frontend
npm install
npm run dev
```

Backend should be running separately on port 3000. The uploaded source archive contained the frontend application only, so the backend source itself is not duplicated in this ZIP. Keep your existing `Sky-Guard/backend` folder alongside this `Frontend` folder.
