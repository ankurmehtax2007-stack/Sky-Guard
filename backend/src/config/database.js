// mongoose connection
import mongoose from "mongoose";

// local module import 
import config from "./config.js";
import logger from "../utils/logger.js";

const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoURI);
        logger.info("Database connected");
    } catch (error) {
        logger.error({ error }, "Error connecting to database");
        throw error;
    }
};

export const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        logger.info("Database disconnected");
    } catch (error) {
        logger.error({ error }, "Error disconnecting from database");
        throw error;
    }
}

export default connectDB;