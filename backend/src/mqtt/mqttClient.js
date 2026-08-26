// external modules import
import mqtt from "mqtt";
// local modules import
import handleReading from "../modules/readings/reading.handler.js";
import config from "../config/config.js";
import logger from "../utils/logger.js";

let client = null;
let mqttConnected = false;
let shuttingDown = false;

const connectMQTT = () => {

    client = mqtt.connect({
        host: config.mqttBroker,
        port: config.mqttPort
    });

    client.on("connect", () => {

        mqttConnected = true;

        logger.info("MQTT Client connected");

        client.subscribe("weather/readings/+");
    });

    client.on("close", () => {

        mqttConnected = false;

        logger.info("MQTT disconnected");
    });

    client.on("message", async (topic, message) => {

        if (shuttingDown) {
            logger.info("MQTT is shutting down. Message skipped.");
            return;
        }

        let data;

        try {
            data = JSON.parse(message.toString());
        } catch (error) {
            logger.error({error}, "Invalid JSON");
            return;
        }

        try {
            await handleReading(data);
        } catch (error) {
            logger.error({error}, "Invalid sensor reading");
        }
    });

    return client;
};

export const stopMQTT = () => {

    shuttingDown = true;

    return new Promise((resolve) => {

        if (!client) {
            resolve();
            return;
        }

        client.end(false, {}, () => {
            mqttConnected = false;
            logger.info("MQTT connection closed");
            resolve();
        });
    });
};

export const isMqttConnected = () => {
    return mqttConnected;
};

export default connectMQTT;