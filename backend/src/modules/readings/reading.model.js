import mongoose from "mongoose";

const readingSchema = new mongoose.Schema({
    stationId: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        required: true
    },
    temperature: {
        type: Number,
        required: true
    },
    humidity: {
        type: Number,
        required: true
    },
    pressure: {
        type: Number,
        required: true
    },
    mlStatus: {
        type: String,
        enum: ["pending", "processed"],
        default: "pending"
    },
    anomalyStatus: {
        type: String,
        enum: ["none", "detected", "saved"],
        default: "none"
    },
    anomalyPrediction: {
        type: Object,
    }
});

readingSchema.index({
    stationId: 1,
    timestamp: -1
});

export const SensorReading = mongoose.model("SensorReading", readingSchema);
