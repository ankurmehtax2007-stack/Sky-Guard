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
    approveUser,
    rejectUser,
} from "./auth.controller.js";
import { authenticateUser, authorize } from "./auth.middleware.js";
import { PERMISSIONS } from "./rbac/permissions.js";

const userRoutes = Router();

userRoutes.get("/pending", authenticateUser, authorize(PERMISSIONS.USERS_READ), (req, res, next) => {
    req.query.status = "PENDING";
    next();
}, getAllUsers);

userRoutes.get("/active", authenticateUser, authorize(PERMISSIONS.USERS_READ), (req, res, next) => {
    req.query.status = "ACTIVE";
    next();
}, getAllUsers);

userRoutes.get("/rejected", authenticateUser, authorize(PERMISSIONS.USERS_READ), (req, res, next) => {
    req.query.status = "REJECTED";
    next();
}, getAllUsers);

userRoutes.get("/", authenticateUser, (req, res, next) => {
    const role = (req.user?.role || "").toLowerCase();
    if (role === "operator" && req.query.role === "engineer") {
        return next();
    }
    return authorize(PERMISSIONS.USERS_READ)(req, res, next);
}, getAllUsers);
userRoutes.post("/", authenticateUser, authorize(PERMISSIONS.USERS_CREATE), createUserByAdmin);
userRoutes.get("/:id", authenticateUser, authorize(PERMISSIONS.USERS_READ), getUserById);
userRoutes.put("/:id", authenticateUser, authorize(PERMISSIONS.USERS_UPDATE), updateUser);
userRoutes.patch("/:id/role", authenticateUser, authorize(PERMISSIONS.ROLES_MANAGE), updateUserRole);

userRoutes.patch("/:id/station", authenticateUser, authorize(PERMISSIONS.STATIONS_ASSIGN), assignStationController);

userRoutes.patch("/:id/status", authenticateUser, authorize(PERMISSIONS.USERS_MANAGE_STATUS), updateUserStatusController);

userRoutes.patch("/:id/approve", authenticateUser, authorize(PERMISSIONS.USER_APPROVE), approveUser);
userRoutes.patch("/:id/reject", authenticateUser, authorize(PERMISSIONS.USER_REJECT), rejectUser);

userRoutes.delete("/:id", authenticateUser, authorize(PERMISSIONS.USERS_DELETE), deleteUser);

export default userRoutes;
