import bcrypt from "bcrypt";
import mongoose from "mongoose";
import config from "../config/config.js";
import { loginService, logoutService, registerService, refreshSessionService, getAllUsersService, getUserByIdService, deleteUserService, createUserService, updateUserService } from "./auth.service.js";
import {
    findAllUsers,
    findUserById,
    findUserByEmail,
    updateUserById,
    deleteUserById,
    createUser,
    assignUserStation,
    updateUserStatus,
} from "./user.repository.js";
import { stationExists } from "../modules/stations/station.repository.js";
import logger from "../utils/logger.js";

export const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        res.status(200).json({
            user: {
                id: req.user._id || req.user.id,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role,
                status: req.user.status,
                stationId: req.user.stationId,
            },
        });
    } catch (error) {
        logger.error({ error }, "Error fetching current user profile");
        res.status(500).json({ message: "Internal server error" });
    }
};

export const refreshTokenController = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        const { user, accessToken } = await refreshSessionService(refreshToken);

        res.status(200).json({
            message: "Token refreshed successfully",
            user,
            accessToken,
        });
    } catch (error) {
        logger.error({ error }, "Error refreshing token");
        res.status(error.status || 401).json({ message: error.message || "Unauthorized" });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { user, accessToken, refreshToken } = await loginService(
            email,
            password,
            req.get("user-agent"),
            req.ip
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: config.nodeEnv === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "User logged in successfully",
            user,
            accessToken,
        });
    } catch (error) {
        logger.error({ error }, "Error in login");
        res.status(error.status || 500).json({ message: error.message || "Internal server error1" });
    }
};

export const registerUser = async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const { user, accessToken, refreshToken } = await registerService(
            username,
            email,
            password,
            role,
            req.get("user-agent"),
            req.ip
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: config.nodeEnv === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            message: "User registered successfully",
            user,
            accessToken,
        });
    } catch (error) {
        logger.error({ error }, "Error in registration");
        res.status(error.status || 500).json({ message: error.message || "Internal server error2" });
    }
};

export const logoutUser = async (req , res) => {
    try{
        const refreshToken = req.cookies.refreshToken;
        await logoutService(refreshToken);
        res.clearCookie("refreshToken");
        return res.status(200).json({ message: "User logged out successfully" });
    }catch(error){
        logger.error({ error }, "Error in logout");
        res.status(error.status || 500).json({ message: error.message || "Internal server error3" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await getAllUsersService({
            status: req.query.status,
            stationId: req.query.stationId,
            role: req.query.role
        });

        return res.status(200).json(users);
    } catch (error) {
        logger.error({ error }, "Error in fetching users");

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await getUserByIdService(req.params.id);
        res.status(200).json(user);
    } catch (error) {
        logger.error({ error }, "Error in fetching user");
        res.status(error.status || 500).json({ message: error.message || "Internal server error5" });
    }
};

export const updateUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const updates = { ...req.body };
        const callerRole = (req.user?.role || "").toLowerCase();

        const updatedUser = await updateUserService(targetUserId, updates, callerRole);
        res.status(200).json(updatedUser);
    } catch (error) {
        logger.error({ error }, "Error in updating user");
        res.status(500).json({ message: "Internal server error" });
    }
};

export const assignStationController = async (req, res) => {
    try {
        const callerRole = (req.user?.role || "").toLowerCase();
        if (callerRole !== "admin") {
            return res.status(403).json({
                message: "Forbidden: Only administrators can assign stations to users",
            });
        }

        const targetUserId = req.params.userId || req.params.id;
        const { stationId } = req.body;

        if (!stationId) {
            return res.status(400).json({ message: "stationId is required" });
        }

        const cleanStationId = String(stationId).trim();

        // 1. Verify target user exists
        let targetUser = null;
        if (mongoose.connection.readyState === 1) {
            targetUser = await findUserById(targetUserId);
        } else {
            targetUser = {
                _id: targetUserId,
                username: "operator_mock",
                email: "operator@skyguard.ai",
                role: "operator",
                status: "PENDING",
                stationId: null,
            };
        }

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Verify station exists
        const exists = await stationExists(cleanStationId);
        if (!exists) {
            return res.status(404).json({ message: `Station ${cleanStationId} not found` });
        }

        // 3. Assign station and transition user status from PENDING to ACTIVE
        let updatedUser = null;
        if (mongoose.connection.readyState === 1) {
            updatedUser = await assignUserStation(targetUserId, cleanStationId);
        } else {
            targetUser.stationId = cleanStationId;
            targetUser.status = "ACTIVE";
            updatedUser = targetUser;
        }

        res.status(200).json({
            message: "Station assigned and user activated successfully",
            user: {
                id: updatedUser._id || updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                status: updatedUser.status,
                stationId: updatedUser.stationId,
            },
        });
    } catch (error) {
        logger.error({ error }, "Error assigning station to user");
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateUserStatusController = async (req, res) => {
    try {
        const callerRole = (req.user?.role || "").toLowerCase();
        if (callerRole !== "admin") {
            return res.status(403).json({
                message: "Forbidden: Only administrators can update user status",
            });
        }

        const targetUserId = req.params.userId || req.params.id;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "status is required" });
        }

        const normalizedStatus = String(status).toUpperCase().trim();
        const validStatuses = ["PENDING", "ACTIVE", "SUSPENDED"];
        if (!validStatuses.includes(normalizedStatus)) {
            return res.status(400).json({
                message: "Invalid status. Allowed values are: PENDING, ACTIVE, SUSPENDED",
            });
        }

        let targetUser = null;
        if (mongoose.connection.readyState === 1) {
            targetUser = await findUserById(targetUserId);
        } else {
            targetUser = { _id: targetUserId, status: "PENDING" };
        }

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        let updatedUser = null;
        if (mongoose.connection.readyState === 1) {
            updatedUser = await updateUserStatus(targetUserId, normalizedStatus);
        } else {
            targetUser.status = normalizedStatus;
            updatedUser = targetUser;
        }

        res.status(200).json({
            message: "User status updated successfully",
            user: {
                id: updatedUser._id || updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                status: updatedUser.status,
                stationId: updatedUser.stationId,
            },
        });
    } catch (error) {
        logger.error({ error }, "Error updating user status");
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const targetUserId = req.params.id;
        const updatedUser = await updateUserService(targetUserId, { role });

        res.status(200).json({
            message: "User role updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        logger.error({ error }, "Error updating user role");
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createUserByAdmin = async (req, res) => {
    try {
        const { username, email, password, role = "viewer", stationId = null, status } = req.body;
        const newUser = await createUserService(username, email, password, role, stationId, status);
        res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status,
                stationId: newUser.stationId,
            },
        });
    } catch (error) {
        logger.error({ error }, "Error creating user by admin");
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        await deleteUserService({ user: req.user, userId: req.params.id });
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        logger.error({ error }, "Error in deleting user");
        res.status(error.status || 500).json({ message: error.message || "Internal server error" });
    }
};
