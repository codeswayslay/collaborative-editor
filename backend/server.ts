import express from 'express';
import WebSocket from 'ws';
import http from 'http';
import path from 'path';
import { setupWSConnection, docs } from 'y-websocket/bin/utils';

const production = process.env.PRODUCTION != null;
const port = Number(process.env.PORT) || 3000;

const app = express();
const httpServer = http.createServer(app);

// Serve health check endpoint
app.get('/health', (req, res) => {
    res.json({ response: 'ok' });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Custom WebSocket path
const customWebSocketPath = '/custom-ws/quill-demo-5';
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket upgrade requests
httpServer.on('upgrade', (request, socket, head) => {
    if (request.url === customWebSocketPath) {
        console.log("socket upgraded")
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        console.log("Socket destroyed")
        socket.destroy();
    }
});

wss.on('connection', (conn, req) => {
    setupWSConnection(conn, req, { gc: req.url?.slice(1) !== 'ws/prosemirror-versions' });

    // Handle incoming messages
    conn.on('message', (message) => {
        let decodedMessage: string | undefined;

        if (message instanceof ArrayBuffer) {
            const textDecoder = new TextDecoder();
            decodedMessage = textDecoder.decode(message);
        } else if (Buffer.isBuffer(message)) {
            decodedMessage = message.toString('utf-8');
        } else {
            // console.log('Unknown message type:', message);
            return;
        }

        // Parse the message as JSON and check its type
        if (decodedMessage) {
            try {
                const parsedMessage = JSON.parse(decodedMessage);
                if (parsedMessage.type === 'content') {
                    console.log('Content message:', parsedMessage.data);
                    // the idea is to store this information the db every couple seconds
                } else {
                    console.log('Other message type:', parsedMessage);
                }
            } catch (error) {
                // no point logging this
                // console.log('Failed to parse message as JSON:', decodedMessage);
            }
        }
    });
});

// Log some stats
setInterval(() => {
    let conns = 0;
    docs.forEach(doc => { conns += doc.conns.size; });
    const stats = {
        conns,
        docs: docs.size,
        websocket: `ws://localhost:${port}${customWebSocketPath}`,
        http: `http://localhost:${port}`
    };
    console.log(`${new Date().toISOString()} Stats: ${JSON.stringify(stats)}`);
}, 10000);

httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Listening to http://localhost:${port} (${production ? 'production' : 'development'})`);
});
