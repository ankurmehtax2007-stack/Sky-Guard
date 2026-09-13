import { createAuditLog, findAuditLogs } from "./audit.repository.js";
import logger from "../../utils/logger.js";

export const logAction = async ({ action, actor = null, target = null, stationId = null, details = {} }) => {
    try {
        await createAuditLog({
            action,
            actor: actor?._id || actor?.id || null,
            actorRole: actor?.role || null,
            actorUsername: actor?.username || "system",
            target: target?._id || target?.id || null,
            targetRole: target?.role || null,
            stationId: stationId || null,
            details,
        });
    } catch (error) {
        logger.error({ error, action }, "Audit log write failed (non-fatal)");
    }
};

export const getAuditLogs = async (filters) => {
    return await findAuditLogs(filters);
};
