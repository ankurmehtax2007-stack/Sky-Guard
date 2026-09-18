import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import {
    findUserByEmail,
    findUserByUsername,
    createUser,
    findUserById,
    deleteUserById,
    updateUserById,
    assignUserStation,
    updateUserStatus,
    findAllUsers,
} from "./user.repository.js";
import { createSession, saveSession, findSessionById } from "./session.repository.js";
import { isValidRole } from "./rbac/permissions.js";
import { stationExists } from "../modules/stations/station.repository.js";
import { createRegistrationNotification, createUserNotification } from "../modules/notifications/notification.service.js";
import { logAction } from "../modules/audit/audit.service.js";


export const loginService = async (email, password, userAgent, ip) => {
    const user = await findUserByEmail(email);

    if (!user) {
        const err = new Error("Invalid email or password");
        err.status = 401;
        throw err;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        await logAction({
            action: "LOGIN_FAILURE",
            actorUsername: email,
            details: { reason: "Invalid password" },
        });
        const err = new Error("Invalid email or password");
        err.status = 401;
        throw err;
    }

    const userStatus = (user.status || "PENDING").toUpperCase();

    if (userStatus === "PENDING") {
        const err = new Error("Your account is awaiting administrator approval.");
        err.status = 403;
        throw err;
    }
    if (userStatus === "REJECTED") {
        const err = new Error("Your registration request was rejected. Please contact an administrator.");
        err.status = 403;
        throw err;
    }
    if (userStatus === "SUSPENDED") {
        const err = new Error("Your account has been suspended. Please contact an administrator.");
        err.status = 403;
        throw err;
    }
    if (userStatus !== "ACTIVE") {
        const err = new Error("Account access denied.");
        err.status = 403;
        throw err;
    }

    const session = await createSession({ user: user._id, userAgent, ip });

    const refreshToken = jwt.sign(
        { userId: user._id, sessionId: session._id },
        config.refreshTokenSecret,
        { expiresIn: "7d" }
    );

    session.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await saveSession(session);

    const userRole = (user.role || "").toLowerCase();
    const userStationId = user.stationId || null;

    const accessToken = jwt.sign(
        {
            userId: user._id,
            id: user._id,
            username: user.username,
            email: user.email,
            role: userRole,
            status: "ACTIVE",
            stationId: userStationId,
        },
        config.accessTokenSecret,
        { expiresIn: "15m" }
    );

    await logAction({
        action: "LOGIN_SUCCESS",
        actor: user,
        stationId: userStationId,
    });

    return {
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: userRole,
            status: "ACTIVE",
            stationId: userStationId,
        },
        accessToken,
        refreshToken,
    };
};


export const registerService = async (username, email, password, role, stationId, userAgent, ip) => {
    const requestedRole = (role || "").toLowerCase().trim();

    if (requestedRole === "admin") {
        const err = new Error("Forbidden: Cannot create an Admin account via public registration");
        err.status = 403;
        throw err;
    }

    const validRoles = ["operator", "engineer"];
    if (!validRoles.includes(requestedRole)) {
        const err = new Error("Invalid role. Allowed roles for registration: engineer, operator");
        err.status = 400;
        throw err;
    }

    if (!stationId) {
        const err = new Error("stationId is required for registration");
        err.status = 400;
        throw err;
    }
    const stationOk = await stationExists(String(stationId).trim());
    if (!stationOk) {
        const err = new Error(`Station ${stationId} not found`);
        err.status = 404;
        throw err;
    }

    const existingByEmail = await findUserByEmail(email);
    if (existingByEmail) {
        const err = new Error("An account with this email already exists");
        err.status = 409;
        throw err;
    }

    const existingByUsername = await findUserByUsername(username);
    if (existingByUsername) {
        const err = new Error("Username is already taken");
        err.status = 409;
        throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const cleanStationId = String(stationId).trim();

    const newUser = await createUser({
        username,
        email,
        password: hashedPassword,
        role: requestedRole,
        status: "PENDING",
        stationId: cleanStationId,
    });

    await logAction({
        action: "USER_REGISTERED",
        actor: newUser,
        stationId: cleanStationId,
        details: { role: requestedRole },
    });

    await createRegistrationNotification({
        userId: newUser._id,
        username: newUser.username,
        role: requestedRole,
        stationId: cleanStationId,
    });

    return {
        user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            status: "PENDING",
            stationId: cleanStationId,
        },
    };
};


export const logoutService = async (refreshToken) => {
    if (!refreshToken) {
        const err = new Error("No refresh token provided");
        err.status = 401;
        throw err;
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
    } catch {
        const err = new Error("Invalid or expired refresh token");
        err.status = 401;
        throw err;
    }

    const session = await findSessionById(decoded.sessionId);
    if (!session) {
        const err = new Error("Session not found");
        err.status = 401;
        throw err;
    }

    session.revoked = true;
    await saveSession(session);

    return { message: "User logged out successfully" };
};


export const refreshSessionService = async (refreshToken) => {
    if (!refreshToken) {
        const err = new Error("No refresh token provided");
        err.status = 401;
        throw err;
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
    } catch {
        const err = new Error("Invalid or expired refresh token");
        err.status = 401;
        throw err;
    }

    const session = await findSessionById(decoded.sessionId);
    if (!session || session.revoked) {
        const err = new Error("Session revoked or expired");
        err.status = 401;
        throw err;
    }

    const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!isMatch) {
        const err = new Error("Invalid refresh token credentials");
        err.status = 401;
        throw err;
    }

    const user = await findUserById(session.user);
    if (!user) {
        const err = new Error("User associated with session not found");
        err.status = 401;
        throw err;
    }

    const userStatus = (user.status || "PENDING").toUpperCase();
    if (userStatus !== "ACTIVE") {
        const err = new Error("Account is no longer active");
        err.status = 403;
        throw err;
    }

    const userRole = (user.role || "").toLowerCase();
    const userStationId = user.stationId || null;

    const accessToken = jwt.sign(
        {
            userId: user._id,
            id: user._id,
            username: user.username,
            email: user.email,
            role: userRole,
            status: "ACTIVE",
            stationId: userStationId,
        },
        config.accessTokenSecret,
        { expiresIn: "15m" }
    );

    return {
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: userRole,
            status: "ACTIVE",
            stationId: userStationId,
        },
        accessToken,
    };
};


export const getAllUsersService = async (filters) => {
    return await findAllUsers(filters);
};

export const getUserByIdService = async (id) => {
    const user = await findUserById(id);
    if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }
    return user;
};


export const approveUserService = async (targetUserId, actor) => {
    const user = await findUserById(targetUserId);
    if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    if (!["engineer", "operator"].includes(user.role)) {
        const err = new Error("Only Engineer or Operator accounts can be approved");
        err.status = 400;
        throw err;
    }

    if (user.status !== "PENDING") {
        const err = new Error(`Cannot approve user with status: ${user.status}. User must be PENDING.`);
        err.status = 400;
        throw err;
    }

    const updated = await updateUserStatus(targetUserId, "ACTIVE");

    await logAction({
        action: "USER_APPROVED",
        actor,
        target: user,
        stationId: user.stationId,
        details: { previousStatus: "PENDING" },
    });

    await createUserNotification({
        recipientId: targetUserId,
        type: "USER_APPROVED",
        message: "Your registration has been approved. You can now log in.",
        stationId: user.stationId,
    });

    return updated;
};

export const rejectUserService = async (targetUserId, actor) => {
    const user = await findUserById(targetUserId);
    if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    if (!["engineer", "operator"].includes(user.role)) {
        const err = new Error("Only Engineer or Operator accounts can be rejected");
        err.status = 400;
        throw err;
    }

    if (user.status !== "PENDING") {
        const err = new Error(`Cannot reject user with status: ${user.status}. User must be PENDING.`);
        err.status = 400;
        throw err;
    }

    const updated = await updateUserStatus(targetUserId, "REJECTED");

    await logAction({
        action: "USER_REJECTED",
        actor,
        target: user,
        stationId: user.stationId,
        details: { previousStatus: "PENDING" },
    });

    await createUserNotification({
        recipientId: targetUserId,
        type: "USER_REJECTED",
        message: "Your registration request was rejected. Please contact an administrator.",
        stationId: user.stationId,
    });

    return updated;
};


export const deleteUserService = async ({ user, userId }) => {
    if (user && (user.id === userId || user._id?.toString() === userId)) {
        const err = new Error("Cannot delete your own active account");
        err.status = 400;
        throw err;
    }
    const deletedUser = await deleteUserById(userId);
    if (!deletedUser) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    await logAction({
        action: "USER_DEACTIVATED",
        actor: user,
        target: deletedUser,
        stationId: deletedUser.stationId,
    });

    return deletedUser;
};


export const createUserService = async (username, email, password, role = "engineer", stationId = null, status) => {
    if (!username || !email || !password) {
        const err = new Error("Username, email, and password are required");
        err.status = 400;
        throw err;
    }

    const normalizedRole = role.toLowerCase().trim();

    if (!isValidRole(normalizedRole)) {
        const err = new Error("Invalid role. Allowed roles are: admin, engineer, operator");
        err.status = 400;
        throw err;
    }

    let assignedStationId = null;
    if (stationId && normalizedRole !== "admin") {
        const exists = await stationExists(String(stationId).trim());
        if (!exists) {
            const err = new Error(`Station ${stationId} not found`);
            err.status = 404;
            throw err;
        }
        assignedStationId = String(stationId).trim();
    } else if (normalizedRole !== "admin") {
        assignedStationId = "AWS_01";
    }

    let initialStatus = "ACTIVE";
    if (status) {
        const normalizedStatus = String(status).toUpperCase();
        if (!["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"].includes(normalizedStatus)) {
            const err = new Error("Invalid status. Allowed: PENDING, ACTIVE, REJECTED, SUSPENDED");
            err.status = 400;
            throw err;
        }
        initialStatus = normalizedStatus;
    }

    const existingByEmail = await findUserByEmail(email);
    if (existingByEmail) {
        const err = new Error("An account with this email already exists");
        err.status = 409;
        throw err;
    }

    const existingByUsername = await findUserByUsername(username);
    if (existingByUsername) {
        const err = new Error("Username is already taken");
        err.status = 409;
        throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser({
        username,
        email,
        password: hashedPassword,
        role: normalizedRole,
        status: initialStatus,
        stationId: assignedStationId,
    });

    return newUser;
};


export const updateUserService = async (id, updates, callerRole) => {
    if (updates.role !== undefined || updates.status !== undefined || updates.stationId !== undefined) {
        if (callerRole !== "admin") {
            const err = new Error("Forbidden: Only administrators can modify roles, statuses, or station assignments");
            err.status = 403;
            throw err;
        }
    }

    if (updates.role !== undefined) {
        if (!isValidRole(updates.role)) {
            const err = new Error("Invalid role. Allowed roles are: admin, engineer, operator");
            err.status = 400;
            throw err;
        }
        updates.role = updates.role.toLowerCase().trim();
    }

    if (updates.status !== undefined) {
        const normalizedStatus = String(updates.status).toUpperCase().trim();
        if (!["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"].includes(normalizedStatus)) {
            const err = new Error("Invalid status. Allowed values are: PENDING, ACTIVE, REJECTED, SUSPENDED");
            err.status = 400;
            throw err;
        }
        updates.status = normalizedStatus;
    }

    if (updates.stationId !== undefined && updates.stationId !== null) {
        const cleanStationId = String(updates.stationId).trim();
        const exists = await stationExists(cleanStationId);
        if (!exists) {
            const err = new Error(`Station ${cleanStationId} not found`);
            err.status = 404;
            throw err;
        }
        updates.stationId = cleanStationId;
    }

    if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedUser = await updateUserById(id, updates);
    if (!updatedUser) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    return updatedUser;
};

export const updateUserStatusService = async (id, status, callerRole) => {
    if (callerRole !== "admin") {
        const err = new Error("Forbidden: Only administrators can update user status");
        err.status = 403;
        throw err;
    }

    if (!status) {
        const err = new Error("status is required");
        err.status = 400;
        throw err;
    }

    const normalizedStatus = String(status).toUpperCase().trim();
    const validStatuses = ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"];
    if (!validStatuses.includes(normalizedStatus)) {
        const err = new Error("Invalid status. Allowed values are: PENDING, ACTIVE, REJECTED, SUSPENDED");
        err.status = 400;
        throw err;
    }

    const targetUser = await findUserById(id);
    if (!targetUser) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    const updatedUser = await updateUserStatus(id, normalizedStatus);
    return updatedUser;
};

export const assignStationService = async (id, stationId, callerRole) => {
    if (callerRole !== "admin") {
        const err = new Error("Forbidden: Only administrators can assign stations to users");
        err.status = 403;
        throw err;
    }

    if (!stationId) {
        const err = new Error("stationId is required");
        err.status = 400;
        throw err;
    }

    const cleanStationId = String(stationId).trim();

    const targetUser = await findUserById(id);
    if (!targetUser) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    const exists = await stationExists(cleanStationId);
    if (!exists) {
        const err = new Error(`Station ${cleanStationId} not found`);
        err.status = 404;
        throw err;
    }

    const updatedUser = await assignUserStation(id, cleanStationId);
    return updatedUser;
};
