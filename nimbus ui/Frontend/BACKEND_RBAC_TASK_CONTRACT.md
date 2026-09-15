# NIMbus RBAC + City Scope + Work Assignment Integration

This frontend now uses the existing NIMbus Node/Express API. It does **not** store passwords in the browser.

## 1. Admin creates users

The Admin > User Management `+` button sends:

`POST /api/auth/register`

```json
{
  "username": "Engineer One",
  "email": "engineer@nimbus.ai",
  "password": "temporary-password",
  "role": "engineer",
  "city": "Delhi",
  "stationId": "AWS_01"
}
```

The backend must hash the password before saving the user in MongoDB.

Supported roles in this UI:
- `admin`
- `engineer`
- `operator`

The UI also sends `city` and `stationId` so city scope is persisted with the account.

## 2. User list

The existing:

`GET /api/auth`

should return users including `_id`, `username`, `email`, `role`, `city` and/or `stationId`.

The edit action uses:

`PUT /api/auth/:id`

The delete action uses:

`DELETE /api/auth/:id`

## 3. City-scoped admin data

The Admin topbar contains a City selector.

When a city is selected, GET API requests automatically include:

`?city=Delhi`

The backend should enforce this filter server-side for protected telemetry/anomaly/task endpoints. Frontend filtering is also applied as a second layer.

For a true security boundary, the backend must never rely on the frontend's filter alone.

Recommended rule:
- Admin: may select an allowed city (or all cities if the account has global scope).
- Engineer: only their assigned city/station.
- Operator: only their assigned city/station.
- Viewer: read-only, if enabled by the backend RBAC.

## 4. Operator -> Engineer assignment

The Operator sidebar now has **Engineer Assignment**.

The frontend uses:

`GET /api/tasks/engineers?stationId=AWS_01`

to obtain engineers available for that station/city.

Creating work uses:

`POST /api/tasks`

Example payload:

```json
{
  "title": "Anomaly response — AWS_01",
  "description": "Investigate detected sensor anomaly.",
  "stationId": "AWS_01",
  "anomalyId": "<anomaly-id>",
  "priority": "HIGH",
  "assignedTo": "<engineer-user-id>"
}
```

Reassignment uses:

`PATCH /api/tasks/:taskId/assign`

with:

```json
{
  "engineerId": "<engineer-user-id>"
}
```

Status updates use:

`PATCH /api/tasks/:taskId/status`

## 5. MongoDB requirement

To make assignments visible in MongoDB, the backend Task model should persist at least:

- `title`
- `description`
- `stationId`
- `anomalyId`
- `createdBy`
- `assignedTo`
- `priority`
- `status`
- `createdAt`
- `updatedAt`

The User model should persist:

- `username`
- `email`
- `passwordHash` (never the raw password)
- `role`
- `city`
- `stationId`

## Important

The uploaded ZIP contained the frontend only. Therefore this ZIP can call the backend endpoints, but it cannot safely modify the MongoDB schema or Express authorization code that was not included in the upload.

If the backend already implements the task/RBAC endpoints described above, this frontend is ready to use them. If an endpoint/model is named differently in your teammate's backend, update the small API functions in `src/api/auth.js` and `src/api/tasks.js` rather than creating a separate fake/local database.
