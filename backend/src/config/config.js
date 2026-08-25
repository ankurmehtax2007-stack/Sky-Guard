import dotenv from "dotenv";

dotenv.config();

const config = {
    port: process.env.PORT || 3000,
    mongoURI: process.env.MONGODB_URI,
    mqttBroker: process.env.MQTT_BROKER,
    mqttPort: process.env.MQTT_PORT,

    mlServiceURL: process.env.ML_SERVICE_URL,

    accessTokenSecret: process.env.JWT_ACCESS_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET,

    nodeEnv: process.env.NODE_ENV || "development"
}

export default config;