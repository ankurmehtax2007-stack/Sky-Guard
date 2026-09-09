import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import config from "../config/config.js";
import { findUserById } from "./user.repository.js";
import { getPermissionsForRole } from "./rbac/permissions.js";

export const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, config.accessTokenSecret);

        let user = null;
        if (mongoose.connection.readyState === 1) {
            try {
                user = await findUserById(decoded.userId);
            } catch {
                // DB lookup failed or unavailable
            }
        }

        if (!user && decoded.userId && decoded.role) {
            user = {
                _id: decoded.userId,
                id: decoded.userId,
                username: decoded.username || "operator",
                email: decoded.email || "user@skyguard.ai",
                role: decoded.role,
            };
        }

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        // Attach user and computed permissions
        req.user = user;
        req.user.permissions = getPermissionsForRole(user.role);

        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expired"
            });
        }

        return res.status(401).json({
            message: "Invalid token"
        });
    }
};

export const optionalAuthenticateUser = async (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, config.accessTokenSecret);
        let user = null;
        if (mongoose.connection.readyState === 1) {
            try {
                user = await findUserById(decoded.userId);
            } catch {
                // DB lookup failed or unavailable
            }
        }

        if (!user && decoded.userId && decoded.role) {
            user = {
                _id: decoded.userId,
                id: decoded.userId,
                username: decoded.username || "operator",
                email: decoded.email || "user@skyguard.ai",
                role: decoded.role,
            };
        }

        if (user) {
            req.user = user;
            req.user.permissions = getPermissionsForRole(user.role);
        }
    } catch {
        // Continue even if token is invalid
    }
    next();
};

/**
 * Reusable RBAC Permission Authorization Middleware
 * Verifies that the authenticated user possesses the required permission(s).
 * Returns 401 Unauthorized if not authenticated.
 * Returns 403 Forbidden if user lacks required permission.
 *
 * @param {string|string[]} requiredPermission - Single permission or array of acceptable permissions
 * @param {object} [options]
 * @param {boolean} [options.matchAny=true] - If true, user needs any one of the array permissions; if false, all.
 */
export const authorize = (requiredPermission, options = { matchAny: true }) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userRole = (req.user.role || "").toLowerCase();
        const userPermissions = req.user.permissions || getPermissionsForRole(userRole);

        let hasAccess = false;
        if (Array.isArray(requiredPermission)) {
            if (options.matchAny !== false) {
                hasAccess = requiredPermission.some((perm) => userPermissions.includes(perm));
            } else {
                hasAccess = requiredPermission.every((perm) => userPermissions.includes(perm));
            }
        } else {
            hasAccess = userPermissions.includes(requiredPermission);
        }

        if (!hasAccess) {
            return res.status(403).json({
                message: "Forbidden: Insufficient permissions",
                requiredPermission,
                userRole,
            });
        }

        next();
    };
};

/**
 * Legacy Role Authorizer (kept for backwards compatibility)
 */
export const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
        const userRole = (req.user.role || "").toLowerCase();
        const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

        if (!normalizedAllowed.includes(userRole)) {
            return res.status(403).json({
                message: "Forbidden: Insufficient permissions",
                userRole,
            });
        }

        next();
    };
};