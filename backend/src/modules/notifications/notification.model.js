import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipientRole: {
            type: String,
            enum: ["admin", "operator", "engineer"],
            default: "admin",
        },
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        type: {
            type: String,
            required: [true, "Notification type is required"],
            enum: [
                "USER_REGISTRATION",   // new engineer/operator registered
                "USER_APPROVED",
                "USER_REJECTED",
                "TASK_ASSIGNED",
                "TASK_STATUS_UPDATED",
                "TASK_COMPLETED",
                "SYSTEM",
            ],
        },
        message: {
            type: String,
            required: [true, "Message is required"],
        },
        relatedUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        relatedTaskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            default: null,
        },
        stationId: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ["UNREAD", "READ"],
            default: "UNREAD",
        },
    },
    { timestamps: true }
);

notificationSchema.index({ recipientRole: 1, status: 1 });
notificationSchema.index({ recipientId: 1, status: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
