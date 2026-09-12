import { Router } from "express";
import {
    getAllUsers,
    getUserById,
    updateUser,
    updateUserRole,
    createUserByAdmin,
    deleteUser,
    assignStationController,
    updateUserStatusController,
} from "./auth.controller.js";
import { authenticateUser, authorize } from "./auth.middleware.js";
import { PERMISSIONS } from "./rbac/permissions.js";

const userRoutes = Router();

// Filtering shortcuts
userRoutes.get("/pending", authenticateUser, authorize(PERMISSIONS.USERS_READ), (req, res, next) => {
    req.query.status = "PENDING";
    next();
}, getAllUsers);

userRoutes.get("/active", authenticateUser, authorize(PERMISSIONS.USERS_READ), (req, res, next) => {
    req.query.status = "ACTIVE";
    next();
}, getAllUsers);

// User Governance & RBAC Endpoints
userRoutes.get("/", authenticateUser, authorize(PERMISSIONS.USERS_READ), getAllUsers);
userRoutes.post("/", authenticateUser, authorize(PERMISSIONS.USERS_CREATE), createUserByAdmin);
userRoutes.get("/:id", authenticateUser, authorize(PERMISSIONS.USERS_READ), getUserById);
userRoutes.put("/:id", authenticateUser, authorize(PERMISSIONS.USERS_UPDATE), updateUser);
userRoutes.patch("/:id/role", authenticateUser, authorize(PERMISSIONS.ROLES_MANAGE), updateUserRole);

// Station assignment (Admin only)
userRoutes.patch("/:id/station", authenticateUser, authorize(PERMISSIONS.STATIONS_ASSIGN), assignStationController);
userRoutes.patch("/:userId/station", authenticateUser, authorize(PERMISSIONS.STATIONS_ASSIGN), assignStationController);

// User status management (Admin only)
userRoutes.patch("/:id/status", authenticateUser, authorize(PERMISSIONS.USERS_MANAGE_STATUS), updateUserStatusController);
userRoutes.patch("/:userId/status", authenticateUser, authorize(PERMISSIONS.USERS_MANAGE_STATUS), updateUserStatusController);

userRoutes.delete("/:id", authenticateUser, authorize(PERMISSIONS.USERS_DELETE), deleteUser);

export default userRoutes;
