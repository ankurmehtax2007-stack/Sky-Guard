import { Router } from "express";
import {
    loginUser,
    registerUser,
    getAllUsers,
    getUserById,
    updateUser,
    updateUserRole,
    createUserByAdmin,
    deleteUser,
    logoutUser,
    getMe,
    refreshTokenController,
    assignStationController,
    updateUserStatusController,
    approveUser,
    rejectUser,
} from "./auth.controller.js";
import { authenticateUser, authorize } from "./auth.middleware.js";
import { PERMISSIONS } from "./rbac/permissions.js";

const authRoutes = Router();

authRoutes.post("/register", registerUser);
authRoutes.post("/login", loginUser);
authRoutes.post("/refresh", refreshTokenController);
authRoutes.post("/logout", authenticateUser, logoutUser);

authRoutes.get("/me", authenticateUser, getMe);

authRoutes.get("/", authenticateUser, authorize(PERMISSIONS.USERS_READ), getAllUsers);
authRoutes.post("/", authenticateUser, authorize(PERMISSIONS.USERS_CREATE), createUserByAdmin);
authRoutes.post("/users", authenticateUser, authorize(PERMISSIONS.USERS_CREATE), createUserByAdmin);
authRoutes.get("/:id", authenticateUser, authorize(PERMISSIONS.USERS_READ), getUserById);
authRoutes.put("/:id", authenticateUser, authorize(PERMISSIONS.USERS_UPDATE), updateUser);
authRoutes.patch("/:id/role", authenticateUser, authorize(PERMISSIONS.ROLES_MANAGE), updateUserRole);
authRoutes.patch("/:id/station", authenticateUser, authorize(PERMISSIONS.STATIONS_ASSIGN), assignStationController);
authRoutes.patch("/:id/status", authenticateUser, authorize(PERMISSIONS.USERS_MANAGE_STATUS), updateUserStatusController);
authRoutes.delete("/:id", authenticateUser, authorize(PERMISSIONS.USERS_DELETE), deleteUser);

authRoutes.patch("/:id/approve", authenticateUser, authorize(PERMISSIONS.USER_APPROVE), approveUser);
authRoutes.patch("/:id/reject", authenticateUser, authorize(PERMISSIONS.USER_REJECT), rejectUser);

export default authRoutes;