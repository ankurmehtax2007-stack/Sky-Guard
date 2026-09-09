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
});

export const User = mongoose.model("User", userSchema);