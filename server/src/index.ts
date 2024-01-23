import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import Delta from 'quill';
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
 
interface Room{
    document:any,
    users:Set<WebSocket>
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (message: any) => {
        const { type, payload } = JSON.parse(message);
        if(type === "get-document"){
            const document = findOrCreateDocument(payload);
            
        }
        if (type === "send-changes") {
            handleChanges({ type, payload }, ws);
        }
    });
});

server.listen(port)

function handleChanges(messageObj:any , sender:WebSocket){
    wss.clients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'receive-changes', payload: messageObj.payload }));
        }
      });
}
