import { User } from "./user.model.js";

export const findUserByEmail = async (email) => {
    return await User.findOne({ email });
};

export const findUserById = async (id) => {
    return await User.findById(id);
};

export const findAllUsers = async () => {
    return await User.find();
};

export const createUser = async (userData) => {
    return await User.create(userData);
};

export const updateUserById = async (id, userData) => {
    return await User.findByIdAndUpdate(id, userData, { new: true });
};

export const deleteUserById = async (id) => {
    return await User.findByIdAndDelete(id);
};
