import Session from "./session.model.js";

export const createSession = async (sessionData) => {
    return await Session.create(sessionData);
};

export const saveSession = async (session) => {
    return await session.save();
};

export const findSessionById = async (id) => {
    return await Session.findById(id);
};

export const updateSessionById = async (id, sessionData) => {
    return await Session.findByIdAndUpdate(id, sessionData, { new: true });
};

export const deleteSessionById = async (id) => {
    return await Session.findByIdAndDelete(id);
};

export const revokeSession = async (id) => {
    return await Session.findByIdAndUpdate(id, { revoked: true }, { new: true });
};