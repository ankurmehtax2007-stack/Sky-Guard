# NIMbus Frontend — RBAC / City / Assignment Update

## Added
- Admin **User Management +** button in both the User Management page and admin sidebar.
- Admin user-creation modal with:
  - username
  - email
  - password
  - role: admin / engineer / operator
  - city scope
- User creation calls the real `/api/auth/register` backend route (with `/api/auth` POST fallback), so the backend remains responsible for password hashing and MongoDB persistence.
- User table now shows role and city scope.
- Admin topbar **CITY** dropdown with All Cities / Delhi / Mumbai / Bengaluru.
- Selected admin city is persisted in the browser and sent to backend GET requests as `?city=<city>`.
- Dashboard telemetry/anomaly data is filtered to the selected city.
- Operator sidebar renamed to **Engineer Assignment**.
- Operator engineer directory and assignment workflow.
- Operator can open an anomaly and assign it directly to an engineer.
- Anomaly assignments create backend tasks with the anomaly ID, station ID, priority and engineer ID.
- Backend integration contract documenting the required MongoDB fields and API endpoints.

## Important
The uploaded archive contained only the frontend. The Node/Express + MongoDB source was not included, so this archive does not overwrite your teammate's backend code. For full server-side enforcement, the existing backend must support the fields/endpoints documented in `BACKEND_RBAC_TASK_CONTRACT.md`.

## Run
Keep this `Frontend` folder beside your existing `backend` folder.

```bash
npm install
npm run dev
```

The included `.env` points to:

`http://localhost:3000`

Do not commit real passwords or secrets.
