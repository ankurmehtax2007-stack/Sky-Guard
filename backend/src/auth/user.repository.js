import { User } from "./user.model.js";

export const findUserByEmail = async (email) => {
    return await User.findOne({ email });
};

export const findUserById = async (id, includePassword = false) => {
    if (includePassword) {
        return await User.findById(id);
    }
    return await User.findById(id).select("-password");
};

export const findAllUsers = async () => {
    return await User.find().select("-password");
};

export const createUser = async (userData) => {
    return await User.create(userData);
};

export const updateUserById = async (id, userData) => {
    return await User.findByIdAndUpdate(id, userData, { new: true }).select("-password");
};

export const deleteUserById = async (id) => {
    return await User.findByIdAndDelete(id).select("-password");
};
