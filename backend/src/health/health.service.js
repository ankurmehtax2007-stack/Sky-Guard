import mongoose from "mongoose";
import { isMqttConnected } from "../mqtt/mqttClient.js";

const checkMongoDB = async () => {
    try {
        await mongoose.connection.db.admin().ping();

        return {
            status: "up"
        };
    } catch (error) {
        return {
            status: "down"
        };
    }
};

const checkMQTT = async () => {
    return {
        status: isMqttConnected() ? "up" : "down"
    };
};

const checkMLService = async () => {
    // FASTAPI ke aane ke baad kaa kaam (IMPORTANT)!!!!!!!!
    return {
        status: "up"
    };
};

export const checkHealth = async () => {

    const mongo = await checkMongoDB();
    const mqtt = await checkMQTT();
    const ml = await checkMLService();

    const isHealthy =
        mongo.status === "up" &&
        mqtt.status === "up" &&
        ml.status === "up";

    return {
        status: isHealthy ? "healthy" : "unhealthy",

        services: {
            mongodb: mongo,
            mqtt: mqtt,
            ml: ml
        }
    };
};