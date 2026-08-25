import mongoose, { Schema } from "mongoose";

const anomalySchema = new Schema({

    stationId: {
        type: String,
        required: true,
        index: true
    },

    readingId: {
        type: Schema.Types.ObjectId,
        ref: "SensorReading",
        required: true,
        unique: true
    },

    timestamp: {
        type: Date,
        required: true,
        index: true
    },

    sensor: {
        type: String,
        enum: ["temperature", "humidity", "pressure"],
        required: true
    },

    value: {
        type: Number,
        required: true
    },

    anomalyType: {
        type: String,
        required: true
    },

    severity: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        required: true
    },

    confidence: {
        type: Number,
        min: 0,
        max: 1,
        required: true
    },

    message: String,

    action: String,

    status: {
        type: String,
        enum: ["pending", "acknowledged", "resolved"],
        default: "pending"
    },

    resolvedAt: Date,

    resolvedBy: String,

    detectedAt: {
        type: Date,
        default: Date.now
    }

});

export default mongoose.model("Anomaly", anomalySchema);