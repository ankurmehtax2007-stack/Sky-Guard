import { WebSocketServer } from "ws";
import { addClient, broadcast, removeClient } from "./websocket.manager.js";
import logger from "../utils/logger.js";

export const initializeWebSocket = (server) => {
    const wss = new WebSocketServer({ server });
    wss.on("connection", (ws) => {
        logger.info("WebSocket client connected");
        activeWebSocketConnections.inc();
        addClient(ws);
        ws.on("close", () => {
            logger.info("WebSocket client disconnected");
            activeWebSocketConnections.dec();
            removeClient(ws);
        });
        broadcast({
            type: "CONNECTION_SUCCESS",
            message: "WebSocket connected successfully"
        });
    });

    return wss;
};