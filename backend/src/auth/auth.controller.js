import config from "../config/config.js";
import { loginService, logoutService, registerService } from "./auth.service.js";
import {
    findAllUsers,
    findUserById,
    updateUserById,
    deleteUserById,
} from "./user.repository.js";
import logger from "../utils/logger.js";

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
    const { username, email, password } = req.body;

    try {
        const { user, accessToken, refreshToken } = await registerService(
            username,
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
        const users = await findAllUsers();
        res.status(200).json(users);
    } catch (error) {
        logger.error({ error }, "Error in fetching users");
        res.status(500).json({ message: "Internal server error4" });
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await findUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        logger.error({ error }, "Error in fetching user");
        res.status(500).json({ message: "Internal server error5" });
    }
};

export const updateUser = async (req, res) => {
    try {
        const updatedUser = await updateUserById(req.params.id, req.body);
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        logger.error({ error }, "Error in updating user");
        res.status(500).json({ message: "Internal server error6" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        await deleteUserById(req.params.id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        logger.error({ error }, "Error in deleting user");
        res.status(500).json({ message: "Internal server error7" });
    }
};
