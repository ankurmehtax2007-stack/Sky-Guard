import mongoose from "mongoose";
import { Task } from "./task.model.js";

const populateFields = [
    { path: "createdBy", select: "username email role stationId" },
    { path: "assignedTo", select: "username email role stationId" },
    { path: "notes.authorId", select: "username role" },
];

export const createTask = async (data) => {
    if (mongoose.connection.readyState !== 1) {
        return { _id: "mock_" + Date.now(), ...data };
    }
    const task = await Task.create(data);
    return await Task.findById(task._id).populate(populateFields);
};

export const findTaskById = async (taskId) => {
    if (mongoose.connection.readyState !== 1) return null;
    return await Task.findById(taskId).populate(populateFields);
};

export const findTasksByStation = async (stationId, filters = {}) => {
    if (mongoose.connection.readyState !== 1) return [];
    const query = { stationId };
    if (filters.status) query.status = filters.status;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;
    if (filters.priority) query.priority = filters.priority;
    return await Task.find(query)
        .populate(populateFields)
        .sort({ createdAt: -1 });
};

export const findTasksAssignedToUser = async (userId, filters = {}) => {
    if (mongoose.connection.readyState !== 1) return [];
    const query = { assignedTo: userId };
    if (filters.status) query.status = filters.status;
    return await Task.find(query)
        .populate(populateFields)
        .sort({ createdAt: -1 });
};

export const findAllTasks = async (filters = {}) => {
    if (mongoose.connection.readyState !== 1) return [];
    const query = {};
    if (filters.stationId) query.stationId = filters.stationId;
    if (filters.status) query.status = filters.status;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;
    if (filters.createdBy) query.createdBy = filters.createdBy;
    return await Task.find(query)
        .populate(populateFields)
        .sort({ createdAt: -1 });
};

export const updateTaskById = async (taskId, updates) => {
    if (mongoose.connection.readyState !== 1) return null;
    return await Task.findByIdAndUpdate(taskId, updates, { new: true }).populate(populateFields);
};

export const updateTaskStatus = async (taskId, status, completedAt = null) => {
    if (mongoose.connection.readyState !== 1) return null;
    const updates = { status };
    if (status === "COMPLETED" && !completedAt) updates.completedAt = new Date();
    else if (completedAt) updates.completedAt = completedAt;
    return await Task.findByIdAndUpdate(taskId, updates, { new: true }).populate(populateFields);
};

export const addTaskNote = async (taskId, note) => {
    if (mongoose.connection.readyState !== 1) return null;
    return await Task.findByIdAndUpdate(
        taskId,
        { $push: { notes: note } },
        { new: true }
    ).populate(populateFields);
};
