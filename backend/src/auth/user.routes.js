import { Router } from "express";
import {
    getAllUsers,
    getUserById,
    updateUser,
    updateUserRole,
    createUserByAdmin,
    deleteUser,
} from "./auth.controller.js";
import { authenticateUser, authorize } from "./auth.middleware.js";
import { PERMISSIONS } from "./rbac/permissions.js";

const userRoutes = Router();

userRoutes.get("/", authenticateUser, authorize(PERMISSIONS.USERS_READ), getAllUsers);
userRoutes.post("/", authenticateUser, authorize(PERMISSIONS.USERS_CREATE), createUserByAdmin);
userRoutes.get("/:id", authenticateUser, authorize(PERMISSIONS.USERS_READ), getUserById);
userRoutes.put("/:id", authenticateUser, authorize(PERMISSIONS.USERS_UPDATE), updateUser);
userRoutes.patch("/:id/role", authenticateUser, authorize(PERMISSIONS.ROLES_MANAGE), updateUserRole);
userRoutes.delete("/:id", authenticateUser, authorize(PERMISSIONS.USERS_DELETE), deleteUser);

export default userRoutes;
