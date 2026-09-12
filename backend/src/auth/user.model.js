import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true , "Username is Required"],
        unique: [true , "Username already exists"]
    },
    email: {
        type: String,
        required: [true , "Email is Required"],
        unique: [true , "Email already exists"],
    },
    password: {
        type: String,
        required: [true , "Password is Required"],
    },
    role: {
        type: String,
        enum: ["admin", "operator", "engineer", "viewer"],
        default: "viewer",
    },
    status: {
        type: String,
        enum: ["PENDING", "ACTIVE", "SUSPENDED"],
        default: "PENDING",
    },
    stationId: {
        type: String,
        default: null,
        trim: true,
    },
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);