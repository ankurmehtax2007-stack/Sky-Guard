import mongoose from "mongoose";

const stationSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: [true, "Station id is required"],
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Station name is required"],
            trim: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "maintenance"],
            default: "active",
        },
        location: {
            lat: { type: Number, default: 0 },
            lng: { type: Number, default: 0 },
        },
        createdBy: {
            type: String,
            default: "system",
        },
    },
    { timestamps: true }
);

export const Station = mongoose.model("Station", stationSchema);
