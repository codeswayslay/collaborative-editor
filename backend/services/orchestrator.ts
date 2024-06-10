import http from 'http';
import WebSocket from 'ws';
import { setupWSConnection, docs } from 'y-websocket/bin/utils';

let debounceTimeout: NodeJS.Timeout;
let saveNeeded = false;
let lastContent: string;

export function setupOrchastration(httpServer: http.Server, wss: WebSocket.Server): void {
    httpServer.on('upgrade', (request, socket, head) => {
        const url = new URL(request.url!, `http://${request.headers.host}`);
        const pathname = url.pathname;

        // Check if the path matches the custom WebSocket path pattern
        const match = pathname.match(/^\/documents\/(.+)$/);
        if (match) {
            const documentId = match[1];
            wss.handleUpgrade(request, socket, head, (ws) => {
                // Attach documentId to WebSocket connection
                (ws as any).documentId = documentId;
                wss.emit('connection', ws, request);
                console.log("Created connection for ")
            });
        } else {
            socket.destroy();
        }
    });

    wss.on('connection', (conn, req) => {
        const documentId = (conn as any).documentId;
        if (documentId) {
            console.log(`Connected to document: ${documentId}`);
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
                    // console.log('Unknown message type:', message);
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
                            debounceTimeout = setTimeout(() => {
                                if (saveNeeded) {
                                    saveContentToDatabase(lastContent);
                                    saveNeeded = false;
                                }
                            }, 1000);
                        } else {
                            // console.log('Other message type:', parsedMessage);
                        }
                    } catch (error) {
                        // no point logging this
                        // console.log('Failed to parse message as JSON:', decodedMessage);
                    }
                }
            });
        } else {
            console.log("Connection closed: No document ID found");
            conn.close();
        }
    });
}


function saveContentToDatabase(content: string) {
    // Save content to the database
    console.log('Saving content to database:', content);
}

export function monitorOrchastration(port: number, interval: number = 10000): void {
    setInterval(() => {
        let conns = 0;
        const info: {}[] = [];
        docs.forEach(doc => {
            conns += doc.conns.size;
            const stats = {
                conns,
                docs: docs.size,
                websocket: `http://localhost:${port}/${doc.name}`,
                http: `http://localhost:${port}`
            };
            info.push(stats)
        });
        console.log(`${new Date().toISOString()} Stats: ${JSON.stringify(info)}`);
    }, interval);
}