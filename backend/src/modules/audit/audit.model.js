import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: [true, "Action is required"],
            trim: true,
        },
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        actorRole: {
            type: String,
            default: null,
        },
        actorUsername: {
            type: String,
            default: "system",
        },
        target: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        targetRole: {
            type: String,
            default: null,
        },
        stationId: {
            type: String,
            default: null,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

auditLogSchema.index({ action: 1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ stationId: 1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
