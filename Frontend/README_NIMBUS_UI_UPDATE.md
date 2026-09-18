# NIMbus UI / RBAC update

This version updates the role dashboards and city scoping:

- Admin dashboard: anomaly pending/resolved cards plus resolved counts for Engineer 1, Engineer 2 and Engineer 3.
- Engineer dashboard: Work Given, Work Done and Work Pending cards.
- Admin and Engineer no longer show a separate Work & Performance / My Work navigation item.
- Operator keeps Engineer Assignment for assigning detected work.
- Operator anomaly assignment now uses a two-step backend flow: create task, then PATCH the task assignment. This avoids backends that reject direct assignment during task creation with a task-access validation error.
- City scope is isolated per authenticated account. A stale admin city selection is never sent with a new engineer/operator session.
- Changing admin city replaces the live telemetry snapshot instead of mixing the previous city's readings with the new city.
- Anomaly lists are reset to the newly fetched city scope rather than merging cached anomalies from another city.
- Dashboard work statistics are read from the backend task APIs, and user/engineer data is read from the backend user API.

## MongoDB

The frontend does not contain a MongoDB driver. User creation and task creation/assignment call the existing Node/Express API, so persistence depends on the backend endpoints and MongoDB models being implemented there.

Expected task endpoints:
- GET /api/tasks
- GET /api/tasks/my
- POST /api/tasks
- PATCH /api/tasks/:taskId/assign
- PATCH /api/tasks/:taskId/status
- GET /api/tasks/engineers

Expected user endpoints:
- POST /api/auth/register
- GET /api/auth
- PUT /api/auth/:id
- DELETE /api/auth/:id
