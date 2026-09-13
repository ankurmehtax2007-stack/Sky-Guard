import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is Required"],
        unique: [true, "Username already exists"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is Required"],
        unique: [true, "Email already exists"],
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is Required"],
    },
    role: {
        type: String,
        enum: ["admin", "operator", "engineer"],
        default: "engineer",
    },
    status: {
        type: String,
        enum: ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"],
        default: "PENDING",
    },
    stationId: {
        type: String,
        default: null,
        trim: true,
    },
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ stationId: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ role: 1, stationId: 1 });

export const User = mongoose.model("User", userSchema);