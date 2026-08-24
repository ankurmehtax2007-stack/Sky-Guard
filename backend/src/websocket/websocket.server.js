import { WebSocketServer } from "ws";
import { addClient, broadcast, removeClient } from "./websocket.manager.js";

export const initializeWebSocket = (server) => {
    const wss = new WebSocketServer({ server });
    wss.on("connection", (ws) => {
        console.log("WebSocket client connected");
        addClient(ws);
        ws.on("close", () => {
            console.log("WebSocket client disconnected");
            removeClient(ws);
        });
        broadcast({
            type: "CONNECTION_SUCCESS",
            message: "WebSocket connected successfully"
        });
    });

    return wss;
};