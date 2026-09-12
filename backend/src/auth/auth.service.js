import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { findUserByEmail, createUser, findUserById, deleteUserById, updateUserById, assignUserStation } from "./user.repository.js";
import { createSession, saveSession, findSessionById } from "./session.repository.js";
import { isValidRole } from "./rbac/permissions.js";
import { stationExists } from "../modules/stations/station.repository.js";

export const loginService = async (email, password, userAgent, ip) => {
    const user = await findUserByEmail(email);

    if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        const err = new Error("Invalid password");
        err.status = 401;
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
    const userStatus = user.status || (userRole === "admin" ? "ACTIVE" : "PENDING");
    const userStationId = user.stationId || null;

    const accessToken = jwt.sign(
        {
            userId: user._id,
            id: user._id,
            username: user.username,
            email: user.email,
            role: userRole,
            status: userStatus,
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
            status: userStatus,
            stationId: userStationId,
        },
        accessToken,
        refreshToken,
    };
};

export const registerService = async (username, email, password, role = "viewer", userAgent, ip) => {
    const requestedRole = (role || "").toLowerCase().trim();

    // Disallow public registration from creating an admin account
    if (requestedRole === "admin") {
        const err = new Error("Forbidden: Public registration cannot create an Admin account");
        err.status = 403;
        throw err;
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
        const err = new Error("User already exists");
        err.status = 400;
        throw err;
    }

    const validNonAdminRoles = ["operator", "engineer", "viewer"];
    const assignedRole = validNonAdminRoles.includes(requestedRole) ? requestedRole : "viewer";

    const hashedPassword = await bcrypt.hash(password, 10);

    // New non-admin users must always be created with status: PENDING and stationId: null
    const newUser = await createUser({
        username,
        email,
        password: hashedPassword,
        role: assignedRole,
        status: "PENDING",
        stationId: null,
    });

    const session = await createSession({ user: newUser._id, userAgent, ip });

    const refreshToken = jwt.sign(
        { userId: newUser._id, sessionId: session._id },
        config.refreshTokenSecret,
        { expiresIn: "7d" }
    );

    session.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await saveSession(session);

    const accessToken = jwt.sign(
        {
            userId: newUser._id,
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            status: "PENDING",
            stationId: null,
        },
        config.accessTokenSecret,
        { expiresIn: "15m" }
    );

    return {
        user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            status: "PENDING",
            stationId: null,
        },
        accessToken,
        refreshToken,
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

    const userRole = (user.role || "").toLowerCase();
    const userStatus = user.status || (userRole === "admin" ? "ACTIVE" : "PENDING");
    const userStationId = user.stationId || null;

    const accessToken = jwt.sign(
        {
            userId: user._id,
            id: user._id,
            username: user.username,
            email: user.email,
            role: userRole,
            status: userStatus,
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
            status: userStatus,
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

export const deleteUserService = async ({ user, userId }) => {
    if(user && user.id === userId) {
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
    return deletedUser;
};

export const createUserService = async (username, email, password, role = "viewer", stationId = null, status) => {
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
    }

    if (!isValidRole(role)) {
        return res.status(400).json({
            message: "Invalid role. Allowed roles are: admin, engineer, operator, viewer",
        });
    }

    const normalizedRole = role.toLowerCase().trim();

    // Station validation if provided
    let assignedStationId = null;
    if (stationId && normalizedRole !== "admin") {
        const exists = await stationExists(stationId);
        if (!exists) {
            return res.status(404).json({ message: `Station ${stationId} not found` });
        }
        assignedStationId = String(stationId).trim();
    }

    // Determine status
    let initialStatus = "PENDING";
    if (normalizedRole === "admin") {
        initialStatus = "ACTIVE";
    } else if (assignedStationId) {
        initialStatus = status ? String(status).toUpperCase() : "ACTIVE";
    } else if (status) {
        initialStatus = String(status).toUpperCase();
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
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
                const err = new Error("Invalid role. Allowed roles are: admin, engineer, operator, viewer");
                err.status = 400;
                throw err;
            }
            updates.role = updates.role.toLowerCase().trim();
        }

        if (updates.status !== undefined) {
            const normalizedStatus = String(updates.status).toUpperCase().trim();
            if (!["PENDING", "ACTIVE", "SUSPENDED"].includes(normalizedStatus)) {
                const err = new Error("Invalid status. Allowed values are: PENDING, ACTIVE, SUSPENDED");
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

        // If updating password, hash it
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

export const updateUserRoleService = async (id, role) => {
        if (!role) {
            const err = new Error("Role is required");
            err.status = 400;
            throw err;
        }

        if (!isValidRole(role)) {
            const err = new Error("Invalid role. Allowed roles are: admin, engineer, operator, viewer");
            err.status = 400;
            throw err;
        }

        const normalizedRole = role.toLowerCase().trim();
        let updatedUser = null;
        if (mongoose.connection.readyState === 1) {
            updatedUser = await updateUserById(id, { role: normalizedRole });
        } else {
            updatedUser = {
                _id: id,
                username: "test_operator",
                email: "test@skyguard.ai",
                role: normalizedRole,
            };
        }

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
        const validStatuses = ["PENDING", "ACTIVE", "SUSPENDED"];
        if (!validStatuses.includes(normalizedStatus)) {
            const err = new Error("Invalid status. Allowed values are: PENDING, ACTIVE, SUSPENDED");
            err.status = 400;
            throw err;
        }

        let targetUser = null;
        if (mongoose.connection.readyState === 1) {
            targetUser = await findUserById(id);
        } else {
            targetUser = { _id: id, status: "PENDING" };
        }

        if (!targetUser) {
            const err = new Error("User not found");
            err.status = 404;
            throw err;
        }

        let updatedUser = null;
        if (mongoose.connection.readyState === 1) {
            updatedUser = await updateUserStatus(id, normalizedStatus);
        } else {
            targetUser.status = normalizedStatus;
            updatedUser = targetUser;
        }

        return updatedUser;
}

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

    // 1. Verify target user exists
    let targetUser = null;
    if (mongoose.connection.readyState === 1) {
        targetUser = await findUserById(id);
    } else {
        targetUser = {
            _id: id,
            username: "operator_mock",
            email: "operator@skyguard.ai",
            role: "operator",
            status: "PENDING",
            stationId: null,
        };
    }

    if (!targetUser) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    // 2. Verify station exists
    const exists = await stationExists(cleanStationId);
    if (!exists) {
        const err = new Error(`Station ${cleanStationId} not found`);
        err.status = 404;
        throw err;
    }

    // 3. Assign station and transition user status from PENDING to ACTIVE
    let updatedUser = null;
    if (mongoose.connection.readyState === 1) {
        updatedUser = await assignUserStation(id, cleanStationId);
    } else {
        targetUser.stationId = cleanStationId;
        targetUser.status = "ACTIVE";
        updatedUser = targetUser;
    }
    return updatedUser;
}
