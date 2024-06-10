import express from 'express';
import WebSocket from 'ws';
import http from 'http';
import path from 'path';
import { setupWSConnection, docs } from 'y-websocket/bin/utils';
import { monitorOrchastration, setupOrchastration } from "./services/orchestrator"

const port = Number(process.env.PORT) || 3000;

const app = express();
const httpServer = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req, res) => {
    res.json({ response: 'ok' });
});

setupOrchastration(httpServer, wss);

monitorOrchastration(port);

httpServer.listen(port, () => {
    console.log(`Listening to http://localhost:${port}`);
});
