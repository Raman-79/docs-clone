"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const cors_1 = __importDefault(require("cors"));
const ws_2 = require("ws");
const mongoose_1 = __importDefault(require("mongoose"));
const app = (0, express_1.default)();
const port = 3001;
mongoose_1.default.connect("mongodb://127.0.0.1:27017/google-docs").then(() => {
    console.log("Connected to db");
})
    .catch((err) => {
    console.log("Error in database", err);
});
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
}));
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const { type, payload } = JSON.parse(message);
        if (type === "send-changes") {
            handleChanges({ type, payload }, ws);
        }
    });
});
server.listen(port);
function handleChanges(messageObj, sender) {
    wss.clients.forEach((client) => {
        if (client !== sender && client.readyState === ws_2.WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'receive-changes', payload: messageObj.payload }));
        }
    });
}
