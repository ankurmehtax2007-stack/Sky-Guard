import mongoose from "mongoose";
import { User } from "./user.model.js";

export const findUserByEmail = async (email) => {
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    return await User.findOne({ email });
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
    if (mongoose.connection.readyState !== 1) { //mongoose connection check
        return [];
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
    if (mongoose.connection.readyState !== 1) {
        return {
            _id: "mock_" + Date.now(),
            ...userData,
        };
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
