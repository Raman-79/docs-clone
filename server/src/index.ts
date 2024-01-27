import express,{Request} from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from 'cors';
import { WebSocket } from 'ws';
import  Document  from "./Document";
import mongoose from 'mongoose';


const app = express();
const port = 3001;
mongoose.connect("mongodb://127.0.0.1:27017/google-docs").then(()=>{
    console.log("Connected to db");
})
.catch((err)=>{
    console.log("Error in database", err);
}) 


app.use(cors({
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
}))
const defaultValue = "";   
class Room{
    private clients: Set<WebSocket>;
    constructor(){
        this.clients = new Set();
    }
    addClient(client:WebSocket){
        this.clients.add(client);
    }
    removeClient(client:WebSocket){
        this.clients.delete(client);
    }
    broadcast(message:Object, sender:WebSocket):void{
        this.clients.forEach((client)=>{
            if(client !== sender && client.readyState === WebSocket.OPEN){
                client.send(JSON.stringify({type: "receive-changes", payload: message}));
            }
        })
    }
    getClients():Set<WebSocket>{
        return this.clients;
    }
}
const rooms = new Map<string, Room>();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {    
    ws.on('message', async (message: any) => {
        const parsedMessage = JSON.parse(message);
        switch (parsedMessage.type) {
            case 'get-document': {
                const docId = parsedMessage.payload.docId;
                if (!rooms.has(docId)) {
                    rooms.set(docId, new Room());
                }
                const room = rooms.get(docId) as Room;
                room.addClient(ws);

                const document = await findOrCreateDocument(docId);
                ws.send(JSON.stringify({ type: "load-document", payload: document?.data }));
                break;
            }
            case 'send-changes': {
                const docId = parsedMessage.payload.docId;
                const room = rooms.get(docId) as Room; 
                if (room) {
                    room.broadcast(parsedMessage.payload.data, ws);
                }
                break;
            }
            case 'save-document': {
                const value = parsedMessage.payload.data;
                const docId = parsedMessage.payload.docId;
                await Document.findByIdAndUpdate(docId, { data: value });
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
    });
    
}); 

server.listen(port);
async function findOrCreateDocument(id: string) {
    try {
        if (id == null) return;
        const document = await Document.findOne({ _id: id });
        if (document) return document;
        else {
            await Document.create({ _id: id, data: defaultValue });
        }
    } catch (error) {
        console.error("Error in findOrCreateDocument:", error);
    }
}

