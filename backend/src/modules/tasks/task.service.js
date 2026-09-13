import {
    createTask,
    findTaskById,
    findTasksByStation,
    findTasksAssignedToUser,
    findAllTasks,
    updateTaskById,
    updateTaskStatus,
    addTaskNote,
} from "./task.repository.js";
import { findUserById } from "../../auth/user.repository.js";
import { logAction } from "../audit/audit.service.js";
import { createUserNotification } from "../notifications/notification.service.js";

const VALID_TRANSITIONS = {
    PENDING: ["ONGOING"],
    ONGOING: ["BLOCKED", "COMPLETED"],
    BLOCKED: ["ONGOING"],
    COMPLETED: [],
};

export const createTaskService = async ({ title, description, stationId, priority, assignedTo }, actor) => {
    if (!title || !stationId) {
        const err = new Error("title and stationId are required");
        err.status = 400;
        throw err;
    }

    const actorRole = (actor.role || "").toLowerCase();

    if (actorRole === "operator" && actor.stationId !== stationId) {
        const err = new Error("Forbidden: You can only create tasks for your assigned station");
        err.status = 403;
        throw err;
    }

    if (assignedTo) {
        await _validateEngineerStation(assignedTo, stationId);
    }

    const task = await createTask({
        title,
        description: description || "",
        stationId,
        createdBy: actor._id || actor.id,
        assignedTo: assignedTo || null,
        priority: priority || "MEDIUM",
        status: "PENDING",
    });

    await logAction({
        action: "TASK_CREATED",
        actor,
        stationId,
        details: { taskId: task._id, title, assignedTo: assignedTo || null },
    });

    if (assignedTo) {
        await createUserNotification({
            recipientId: assignedTo,
            type: "TASK_ASSIGNED",
            message: `You have been assigned a new task: ${title}`,
            stationId,
        });
    }

    return task;
};

export const assignTaskService = async (taskId, engineerId, actor) => {
    const task = await findTaskById(taskId);
    if (!task) {
        const err = new Error("Task not found");
        err.status = 404;
        throw err;
    }

    if (task.status === "COMPLETED") {
        const err = new Error("Cannot reassign a completed task");
        err.status = 400;
        throw err;
    }

    await _validateEngineerStation(engineerId, task.stationId);

    const updated = await updateTaskById(taskId, { assignedTo: engineerId });

    await logAction({
        action: "TASK_ASSIGNED",
        actor,
        stationId: task.stationId,
        details: { taskId, engineerId },
    });

    await createUserNotification({
        recipientId: engineerId,
        type: "TASK_ASSIGNED",
        message: `You have been assigned task: ${task.title}`,
        stationId: task.stationId,
    });

    return updated;
};

export const updateTaskStatusService = async (taskId, newStatus, actor) => {
    const actorRole = (actor.role || "").toLowerCase();
    const task = await findTaskById(taskId);
    if (!task) {
        const err = new Error("Task not found");
        err.status = 404;
        throw err;
    }

    if (actorRole === "engineer") {
        const assignedId = task.assignedTo?._id?.toString() || task.assignedTo?.toString();
        const actorId = (actor._id || actor.id).toString();
        if (assignedId !== actorId) {
            const err = new Error("Forbidden: You can only update tasks assigned to you");
            err.status = 403;
            throw err;
        }
    }

    const normalizedStatus = String(newStatus).toUpperCase();
    const allowedNext = VALID_TRANSITIONS[task.status] || [];
    if (!allowedNext.includes(normalizedStatus)) {
        const err = new Error(
            `Invalid status transition: ${task.status} → ${normalizedStatus}. Allowed: ${allowedNext.join(", ") || "none"}`
        );
        err.status = 400;
        throw err;
    }

    const updated = await updateTaskStatus(taskId, normalizedStatus);

    await logAction({
        action: "TASK_UPDATED",
        actor,
        stationId: task.stationId,
        details: { taskId, from: task.status, to: normalizedStatus },
    });

    return updated;
};

export const addTaskNoteService = async (taskId, content, actor) => {
    if (!content || !content.trim()) {
        const err = new Error("Note content is required");
        err.status = 400;
        throw err;
    }
    const actorRole = (actor.role || "").toLowerCase();
    const task = await findTaskById(taskId);
    if (!task) {
        const err = new Error("Task not found");
        err.status = 404;
        throw err;
    }

    if (actorRole === "engineer") {
        const assignedId = task.assignedTo?._id?.toString() || task.assignedTo?.toString();
        const actorId = (actor._id || actor.id).toString();
        if (assignedId !== actorId) {
            const err = new Error("Forbidden: You can only add notes to tasks assigned to you");
            err.status = 403;
            throw err;
        }
    }

    const note = {
        authorId: actor._id || actor.id,
        authorUsername: actor.username || "unknown",
        content: content.trim(),
    };
    return await addTaskNote(taskId, note);
};

export const getTasksService = async (filters, actor) => {
    const actorRole = (actor.role || "").toLowerCase();
    if (actorRole === "admin") {
        return await findAllTasks(filters);
    }
    if (actorRole === "operator") {
        return await findTasksByStation(actor.stationId, filters);
    }
    const err = new Error("Forbidden: use GET /api/tasks/my for your assigned tasks");
    err.status = 403;
    throw err;
};

export const getMyTasksService = async (actor, filters = {}) => {
    return await findTasksAssignedToUser(actor._id || actor.id, filters);
};

export const getTaskService = async (taskId) => {
    const task = await findTaskById(taskId);
    if (!task) {
        const err = new Error("Task not found");
        err.status = 404;
        throw err;
    }
    return task;
};


async function _validateEngineerStation(engineerId, stationId) {
    const engineer = await findUserById(engineerId);
    if (!engineer) {
        const err = new Error(`Engineer ${engineerId} not found`);
        err.status = 404;
        throw err;
    }
    if (engineer.role !== "engineer") {
        const err = new Error(`User ${engineer.username} is not an Engineer`);
        err.status = 400;
        throw err;
    }
    if (engineer.stationId !== stationId) {
        const err = new Error(
            `Engineer ${engineer.username} belongs to station ${engineer.stationId}, not ${stationId}. Task assignment rejected.`
        );
        err.status = 400;
        throw err;
    }
    if (engineer.status !== "ACTIVE") {
        const err = new Error(`Engineer ${engineer.username} is not active (status: ${engineer.status})`);
        err.status = 400;
        throw err;
    }
}
