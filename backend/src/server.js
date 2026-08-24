import http from "http";
// local modules import
import app from "./app.js";
import connectDB from "./config/database.js";
import connectMQTT from "./mqtt/mqttClient.js";
import config from "./config/config.js";
import { initializeWebSocket } from "./websocket/websocket.server.js";


const startServer = async () => {
    try {
        await connectDB(); 
        connectMQTT();
        console.log("Backend started successfully");
    } catch (error) {
        console.error("Failed to start backend:", error.message);
    }
};
const server = http.createServer(app);
initializeWebSocket(server);

const PORT = config.port || 8000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

startServer();