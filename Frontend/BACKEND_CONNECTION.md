# NIMbus Frontend ↔ Backend

This frontend is configured to use the NIMbus Node/Express backend at `http://localhost:3000` by default.

- REST base URL: `VITE_API_URL` (default `http://localhost:3000`)
- Authentication: JWT `Authorization: Bearer <accessToken>`
- Backend task API: `/api/tasks`
- WebSocket: the existing realtime hooks use the backend host/port configured by the frontend.

Create `.env` from `.env.example` when needed:

```env
VITE_API_URL=http://localhost:3000
```

The uploaded ZIP contained the frontend application only; the backend source is not included in that upload. Keep the existing `Sky-Guard/backend` folder alongside this `Frontend` folder when running the full stack.
