import dotenv from "dotenv";

dotenv.config();

const config = {
    port: process.env.PORT || 3000,
    mongoURI: process.env.MONGODB_URI,
    mqttBroker: process.env.MQTT_BROKER,
    mqttPort: process.env.MQTT_PORT,

    mlServiceURL: process.env.ML_SERVICE_URL,
}

export default config;