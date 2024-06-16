import http from 'http';
import WebSocket from 'ws';
import { setupWSConnection, docs } from 'y-websocket/bin/utils';
import { updateDocumentById } from "./documentService";

let debounceTimeout: NodeJS.Timeout;
let saveNeeded = false;
let lastContent: string;

const wss = new WebSocket.Server({ noServer: true });

function generateUniqueID() {
    return Math.random().toString(36).substring(2, 11);
}

export function setupOrchastration(httpServer: http.Server): string {
    let id: string = "";

    httpServer.on('upgrade', (request, socket, head) => {
        const url = new URL(request.url!, `http://${request.headers.host}`);
        const pathname = url.pathname;

        // Check if the path matches the custom WebSocket path pattern
        const match = pathname.match(/^\/documents\/(.+)$/);
        if (match) {
            const requestedDocumentId = match[1];

            // Handle WebSocket upgrade
            wss.handleUpgrade(request, socket, head, (ws) => {
                // Attach documentId to WebSocket connection
                (ws as any).documentId = requestedDocumentId;
                (ws as any).id = generateUniqueID();
                (ws as any).connectionTime = new Date().toISOString();
                wss.emit('connection', ws, request);
                console.log("Created connection for document:", requestedDocumentId);
            });
        } else {
            console.log("Invalid WebSocket path:", pathname);
            socket.destroy();
        }
    });

    wss.on('connection', (conn, req) => {
        const connDocumentId = (conn as any).documentId;
        id = connDocumentId;
        console.log(`Connected to document: ${connDocumentId}`);
        // setupWSConnection(conn, req, { gc: req.url?.slice(1) !== 'ws/prosemirror-versions' });
        setupWSConnection(conn, req, { gc: true });

        // Handle incoming messages
        conn.on('message', (message) => {
            let decodedMessage: string | undefined;

            if (message instanceof ArrayBuffer) {
                const textDecoder = new TextDecoder();
                decodedMessage = textDecoder.decode(message);
            } else if (Buffer.isBuffer(message)) {
                decodedMessage = message.toString('utf-8');
            } else {
                console.log('Unknown message type:', message);
                return;
            }

            // Parse the message as JSON and check its type
            if (decodedMessage) {
                try {
                    const parsedMessage = JSON.parse(decodedMessage);
                    if (parsedMessage.type === 'content') {
                        console.log('Content message:', parsedMessage);
                        lastContent = parsedMessage.data;
                        saveNeeded = true;

                        // Debounce database write
                        clearTimeout(debounceTimeout);
                        debounceTimeout = setTimeout(async () => {
                            if (saveNeeded) {
                                await saveContentToDatabase(connDocumentId, lastContent);
                                saveNeeded = false;
                            }
                        }, 1000);
                    } else {
                        // console.log('Other message type:', parsedMessage);
                    }
                } catch (error) {
                    console.log("Parsing error detected. Might be worth investigating");
                }
            }
        });
    });

    return id;
}


async function saveContentToDatabase(id: string, data: string) {
    await updateDocumentById(id, data);
}

export function monitorOrchastration(port: number, documentId: string, interval: number = 10000): void {
    setInterval(() => {
        let conns = 0;
        const info: {}[] = [];

        docs.forEach((doc, docId) => {
            conns += doc.conns.size;
            const connectionDetails: {}[] = [];

            // Iterate over WebSocket clients
            wss.clients.forEach(client => {
                connectionDetails.push({
                    clientId: (client as any).id,
                    readyState: client.readyState,
                    isAlive: client.readyState === WebSocket.OPEN
                });
            });

            const stats = {
                conns,
                websocket: `ws://localhost:${port}/documents/${docId}`,
                connectionDetails
            };
            info.push(stats);
        });
        console.log(`${new Date().toISOString()} Stats: ${JSON.stringify(info)}`);
    }, interval);
}

export function shutdownWebSocketServer() {
    console.log("Closing Websocket server...");
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.close();
    });
    wss.close(() => {
        console.log("WebSocket server closed.");
    })
}