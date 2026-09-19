import {
    createTaskService,
    assignTaskService,
    updateTaskStatusService,
    addTaskNoteService,
    getTasksService,
    getMyTasksService,
    getTaskService,
} from "./task.service.js";
import { findAllUsers } from "../../auth/user.repository.js";
import logger from "../../utils/logger.js";

export const createTask = async (req, res) => {
    try {
        const { title, description, stationId, priority, assignedTo, anomalyId } = req.body;
        const task = await createTaskService(
            { title, description, stationId, priority, assignedTo, anomalyId },
            req.user
        );
        return res.status(201).json({
            message: "Task created successfully",
            task,
        });
    } catch (error) {
        logger.error({ error }, "Error creating task");
        return res.status(error.status || 500).json({ message: error.message || "Internal server error" });
    }
};

export const getTasks = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            assignedTo: req.query.assignedTo,
            priority: req.query.priority,
            stationId: req.query.stationId,
        };
        const tasks = await getTasksService(filters, req.user);
        return res.status(200).json({
            message: "Tasks retrieved successfully",
            tasks,
            count: tasks.length,
        });
    } catch (error) {
        logger.error({ error }, "Error fetching tasks");
        return res.status(error.status || 500).json({ message: error.message || "Internal server error" });
    }
};

export const getMyTasks = async (req, res) => {
    try {
        const filters = { status: req.query.status };
        const tasks = await getMyTasksService(req.user, filters);
        return res.status(200).json({
            message: "Your tasks retrieved successfully",
            tasks,
            count: tasks.length,
        });
    } catch (error) {
        logger.error({ error }, "Error fetching assigned tasks");
        return res.status(error.status || 500).json({ message: error.message || "Internal server error" });
    }
};

export const getTask = async (req, res) => {
    try {
        const task = await getTaskService(req.params.taskId);
        return res.status(200).json({
            message: "Task retrieved successfully",
            task,
        });
    } catch (error) {
        logger.error({ error }, "Error fetching task");
        return res.status(error.status || 500).json({ message: error.message || "Internal server error" });
    }
};

export const assignTask = async (req, res) => {
    try {
        const { engineerId } = req.body;
        if (!engineerId) {
            return res.status(400).json({ message: "engineerId is required" });
        }
        const task = await assignTaskService(req.params.taskId, engineerId, req.user);
        return res.status(200).json({
            message: "Task assigned successfully",
            task,
        });
    } catch (error) {
        logger.error({ error }, "Error assigning task");
        return res.status(error.status || 500).json({ message: error.message || "Internal server error" });
    }
};

export const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: "status is required" });
        }
        const task = await updateTaskStatusService(req.params.taskId, status, req.user);
        return res.status(200).json({
            message: "Task status updated successfully",
            task,
        });
    } catch (error) {
        logger.error({ error }, "Error updating task status");
        return res.status(error.status || 500).json({ message: error.message || "Internal server error" });
    }
};

export const addNote = async (req, res) => {
    try {
        const { content } = req.body;
        const task = await addTaskNoteService(req.params.taskId, content, req.user);
        return res.status(201).json({
            message: "Note added successfully",
            task,
        });
    } catch (error) {
        logger.error({ error }, "Error adding note");
        return res.status(error.status || 500).json({ message: error.message || "Internal server error" });
    }
};

export const getAssignableEngineers = async (req, res) => {
    try {
        const { stationId } = req.query;
        const filter = { role: "engineer", status: "ACTIVE" };
        if (stationId) filter.stationId = stationId;
        const engineers = await findAllUsers(filter);
        return res.status(200).json({
            message: "Assignable engineers retrieved successfully",
            engineers,
        });
    } catch (error) {
        logger.error({ error }, "Error fetching assignable engineers");
        return res.status(500).json({ message: "Internal server error" });
    }
};

