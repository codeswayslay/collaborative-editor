declare module 'y-websocket/bin/utils' {
    import WebSocket from 'ws';

    export const docs: Map<string, any>;

    export function setupWSConnection(
        conn: WebSocket,
        req: any,
        options?: { gc: boolean }
    ): void;
}
