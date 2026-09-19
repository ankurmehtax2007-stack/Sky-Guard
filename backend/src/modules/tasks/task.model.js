import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
    {
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        authorUsername: {
            type: String,
            default: "unknown",
        },
        content: {
            type: String,
            required: [true, "Note content is required"],
            trim: true,
        },
    },
    { _id: true, timestamps: true }
);

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Task title is required"],
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        stationId: {
            type: String,
            required: [true, "Station ID is required"],
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "createdBy is required"],
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        anomalyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Anomaly",
            default: null,
        },
        status: {
            type: String,
            enum: ["PENDING", "ONGOING", "BLOCKED", "COMPLETED"],
            default: "PENDING",
        },
        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM",
        },
        notes: {
            type: [noteSchema],
            default: [],
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

taskSchema.index({ stationId: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ stationId: 1, status: 1 });

export const Task = mongoose.model("Task", taskSchema);
