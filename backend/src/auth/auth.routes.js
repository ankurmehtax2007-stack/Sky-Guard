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
} from "./auth.controller.js";
import { authenticateUser, authorize } from "./auth.middleware.js";
import { PERMISSIONS } from "./rbac/permissions.js";

const authRoutes = Router();

// Public auth endpoints
authRoutes.post("/register", registerUser);
authRoutes.post("/login", loginUser);
authRoutes.post("/refresh", refreshTokenController);
authRoutes.post("/logout", authenticateUser, logoutUser);

// Authenticated current session profile
authRoutes.get("/me", authenticateUser, getMe);

// User Governance & RBAC Endpoints (also compatible with /api/users)
authRoutes.get("/", authenticateUser, authorize(PERMISSIONS.USERS_READ), getAllUsers);
authRoutes.post("/", authenticateUser, authorize(PERMISSIONS.USERS_CREATE), createUserByAdmin);
authRoutes.post("/users", authenticateUser, authorize(PERMISSIONS.USERS_CREATE), createUserByAdmin);
authRoutes.get("/:id", authenticateUser, authorize(PERMISSIONS.USERS_READ), getUserById);
authRoutes.put("/:id", authenticateUser, authorize(PERMISSIONS.USERS_UPDATE), updateUser);
authRoutes.patch("/:id/role", authenticateUser, authorize(PERMISSIONS.ROLES_MANAGE), updateUserRole);
authRoutes.delete("/:id", authenticateUser, authorize(PERMISSIONS.USERS_DELETE), deleteUser);

export default authRoutes;