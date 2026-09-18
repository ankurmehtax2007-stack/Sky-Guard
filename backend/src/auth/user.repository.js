import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "./user.model.js";
import logger from "../utils/logger.js";

export const initUserSeed = async () => {
    if (mongoose.connection.readyState !== 1) {
        return;
    }

    try {
        const defaultPasswordHash = await bcrypt.hash("password123", 10);

        const defaultUsers = [
            {
                username: "admin_pilot",
                email: "admin@skyguard.ai",
                password: defaultPasswordHash,
                role: "admin",
                status: "ACTIVE",
                stationId: null,
            },
            {
                username: "operator_pilot",
                email: "operator@skyguard.ai",
                password: defaultPasswordHash,
                role: "operator",
                status: "ACTIVE",
                stationId: "AWS_01",
            },
            {
                username: "engineer_pilot",
                email: "engineer@skyguard.ai",
                password: defaultPasswordHash,
                role: "engineer",
                status: "ACTIVE",
                stationId: "AWS_01",
            },
        ];

        for (const u of defaultUsers) {
            await User.findOneAndUpdate(
                { email: u.email },
                {
                    $set: {
                        username: u.username,
                        password: u.password,
                        role: u.role,
                        status: u.status,
                        stationId: u.stationId,
                    },
                },
                { upsert: true, new: true }
            );
        }

        // Migrate any legacy users in DB that have role "user" or pending status
        await User.updateMany(
            { role: "user" },
            { $set: { role: "operator", status: "ACTIVE", stationId: "AWS_01" } }
        );

        logger.info("Default users (admin, operator, engineer) seeded/verified in MongoDB");
    } catch (error) {
        logger.warn({ error }, "User seeding encountered non-fatal error");
    }
};


export const findUserByEmail = async (email) => {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return await User.findOne({ email: String(email).toLowerCase().trim() });
};

export const findUserByUsername = async (username) => {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return await User.findOne({ username: String(username).trim() });
};


export const findUserById = async (id, includePassword = false) => {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    if (includePassword) {
        return await User.findById(id);
    }
    return await User.findById(id).select("-password");
};

export const findAllUsers = async (filter = {}) => {
    if (mongoose.connection.readyState !== 1) {
        const error = new Error("Database is unavailable; unable to fetch users");
        error.status = 503;
        throw error;
    }
    const query = {};
    if (filter.status) {
        query.status = String(filter.status).toUpperCase();
    }
    if (filter.stationId) {
        query.stationId = filter.stationId;
    }
    if (filter.role) {
        query.role = String(filter.role).toLowerCase();
    }
    return await User.find(query).select("-password").sort({ createdAt: -1 });
};

export const createUser = async (userData) => {
    // Never report a successful account creation unless MongoDB can persist it.
    // Mongoose otherwise buffers this operation while disconnected, which can
    // make the admin UI appear to succeed even though no user was written.
    if (mongoose.connection.readyState !== 1) {
        const error = new Error("Database is unavailable; user was not created");
        error.status = 503;
        throw error;
    }

    return await User.create(userData);
};

export const updateUserById = async (id, userData) => {
    return await User.findByIdAndUpdate(id, userData, { new: true }).select("-password");
};

export const assignUserStation = async (id, stationId) => {
    return await User.findByIdAndUpdate(
        id,
        { stationId, status: "ACTIVE" },
        { new: true }
    ).select("-password");
};

export const updateUserStatus = async (id, status) => {
    return await User.findByIdAndUpdate(
        id,
        { status: String(status).toUpperCase() },
        { new: true }
    ).select("-password");
};

export const deleteUserById = async (id) => {
    return await User.findByIdAndDelete(id).select("-password");
};
