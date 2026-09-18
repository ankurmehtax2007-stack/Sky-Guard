import { Router } from "express";
import { authenticateUser, authorize } from "../../auth/auth.middleware.js";
import { authorizeStationAccess } from "../../middlewares/stationAuth.middleware.js";
import { authorizeTaskAccess } from "../../middlewares/stationAuth.middleware.js";
import { PERMISSIONS } from "../../auth/rbac/permissions.js";
import {
    createTask,
    getTasks,
    getMyTasks,
    getTask,
    assignTask,
    updateTaskStatus,
    addNote,
    getAssignableEngineers,
} from "./task.controller.js";

const taskRoutes = Router();

taskRoutes.post(
    "/",
    authenticateUser,
    authorize(PERMISSIONS.TASK_CREATE),
    createTask
);

taskRoutes.get(
    "/",
    authenticateUser,
    authorize([PERMISSIONS.TASK_READ_ALL, PERMISSIONS.TASK_READ]),
    getTasks
);

taskRoutes.get(
    "/my",
    authenticateUser,
    authorize(PERMISSIONS.TASK_READ),
    getMyTasks
);

taskRoutes.get(
    "/engineers",
    authenticateUser,
    authorize([PERMISSIONS.TASK_ASSIGN, PERMISSIONS.TASK_READ_ALL, PERMISSIONS.TASK_CREATE, PERMISSIONS.TASK_READ]),
    getAssignableEngineers
);

taskRoutes.get(
    "/:taskId",
    authenticateUser,
    authorize(PERMISSIONS.TASK_READ),
    authorizeTaskAccess,
    getTask
);

taskRoutes.patch(
    "/:taskId/assign",
    authenticateUser,
    authorize(PERMISSIONS.TASK_ASSIGN),
    authorizeTaskAccess,
    assignTask
);

taskRoutes.patch(
    "/:taskId/status",
    authenticateUser,
    authorize(PERMISSIONS.TASK_UPDATE),
    authorizeTaskAccess,
    updateTaskStatus
);

taskRoutes.post(
    "/:taskId/notes",
    authenticateUser,
    authorize(PERMISSIONS.TASK_UPDATE),
    authorizeTaskAccess,
    addNote
);

export default taskRoutes;
