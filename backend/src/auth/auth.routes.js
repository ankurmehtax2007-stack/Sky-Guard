import { Router } from "express";
import {
    loginUser,
    registerUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    logoutUser
} from "./auth.controller.js";
import { authenticateUser, authorizeRole } from "./auth.middleware.js";

const authRoutes = Router();

authRoutes.post("/register", registerUser);
authRoutes.post("/login", loginUser);
authRoutes.post("/logout",authenticateUser, logoutUser);

authRoutes.get("/", authenticateUser, authorizeRole(["admin"]), getAllUsers);
authRoutes.get("/:id",authenticateUser, getUserById);
authRoutes.put("/:id",authenticateUser, authorizeRole(["admin"]), updateUser);
authRoutes.delete("/:id",authenticateUser, authorizeRole(["admin"]), deleteUser);

export default authRoutes;