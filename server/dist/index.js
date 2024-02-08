"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const cors_1 = __importDefault(require("cors"));
const ws_2 = require("ws");
const Document_1 = __importDefault(require("./Document"));
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
app.post("/register", (req, res) => {
    const { name } = req.body;
    console.log("Name", name);
    if (name) {
        res.json({ message: "Registered successfully" }).status(200);
    }
    else {
        res.json({ message: "Error in registration" }).status(400);
    }
});
const defaultValue = "";
//Room logic
class Room {
    constructor() {
        this.clients = new Set();
    }
    addClient(client) {
        this.clients.add(client);
    }
    removeClient(client) {
        this.clients.delete(client);
    }
    broadcast(message, sender) {
        this.clients.forEach((client) => {
            if (client !== sender && client.readyState === ws_2.WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "receive-changes", payload: message }));
            }
        });
    }
    getClients() {
        return this.clients;
    }
}
const rooms = new Map();
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
//Ws logic
wss.on('connection', (ws) => {
    ws.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
        const parsedMessage = JSON.parse(message);
        switch (parsedMessage.type) {
            case 'get-document': {
                const docId = parsedMessage.payload.docId;
                if (!rooms.has(docId)) {
                    rooms.set(docId, new Room());
                }
                const room = rooms.get(docId);
                room.addClient(ws);
                const document = yield findOrCreateDocument(docId);
                ws.send(JSON.stringify({ type: "load-document", payload: document === null || document === void 0 ? void 0 : document.data }));
                break;
            }
            case 'send-changes': {
                const docId = parsedMessage.payload.docId;
                const room = rooms.get(docId);
                if (room) {
                    room.broadcast(parsedMessage.payload.data, ws);
                }
                break;
            }
            case 'save-document': {
                const value = parsedMessage.payload.data;
                const docId = parsedMessage.payload.docId;
                yield Document_1.default.findByIdAndUpdate(docId, { data: value });
                break;
            }
            default: {
                ws.on("close", () => {
                    rooms.forEach(room => {
                        room.removeClient(ws);
                        if (room.getClients().size === 0) {
                            rooms.delete(parsedMessage.payload.docId);
                        }
                    });
                });
                break;
            }
        }
    }));
});
server.listen(port);
//Document creation
function findOrCreateDocument(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (id == null)
                return;
            const document = yield Document_1.default.findOne({ _id: id });
            if (document)
                return document;
            else {
                yield Document_1.default.create({ _id: id, data: defaultValue });
            }
        }
        catch (error) {
            console.error("Error in findOrCreateDocument:", error);
        }
    });
}
