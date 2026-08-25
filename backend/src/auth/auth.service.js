import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { findUserByEmail, createUser } from "./user.repository.js";
import { createSession, saveSession, findSessionById } from "./session.repository.js";

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

    const accessToken = jwt.sign(
        { userId: user._id },
        config.accessTokenSecret,
        { expiresIn: "15m" }
    );

    return {
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        },
        accessToken,
        refreshToken,
    };
};

export const registerService = async (username, email, password, userAgent, ip) => {
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
        const err = new Error("User already exists");
        err.status = 400;
        throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await createUser({
        username,
        email,
        password: hashedPassword,
        role: "user",
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
        { userId: newUser._id },
        config.accessTokenSecret,
        { expiresIn: "15m" }
    );

    return {
        user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
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