/* eslint-env browser */

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { QuillBinding } from 'y-quill'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'

Quill.register('modules/cursors', QuillCursors)

window.addEventListener('load', () => {
    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider(
        "ws://localhost:3000/custom-ws",
        'quill-demo-5',
        ydoc
    )
    const ytext = ydoc.getText('quill')
    const editorContainer = document.createElement('div')
    editorContainer.setAttribute('id', 'editor')
    document.body.insertBefore(editorContainer, null)

    const editor = new Quill(editorContainer, {
        modules: {
            cursors: true,
            toolbar: [
                [{ header: [1, 2, false] }],
                ['bold', 'italic', 'underline'],
                ['image', 'code-block']
            ],
            history: {
                userOnly: true
            }
        },
        placeholder: 'Start collaborating...',
        theme: 'snow' // or 'bubble'
    })

    const binding = new QuillBinding(ytext, editor, provider.awareness)

    /*
    // Define user name and user name
    // Check the quill-cursors package on how to change the way cursors are rendered
    provider.awareness.setLocalStateField('user', {
      name: 'Typing Jimmy',
      color: 'blue'
    })
    */

    const connectBtn = document.getElementById('y-connect-btn')
    connectBtn?.addEventListener('click', () => {
        if (provider.shouldConnect) {
            provider.disconnect()
            connectBtn.textContent = 'Connect'
        } else {
            provider.connect()
            connectBtn.textContent = 'Disconnect'
        }
    })

    // Send editor content to server when it changes
    editor.on('text-change', (delta, oldDelta, source) => {
        if (source === "user") {
            const content = editor.getText(); // Get the plain text content of the editor
            const message = JSON.stringify({ type: 'content', data: content });
            console.log(message)
            sendMessageToServer(message)
        }
    });

    // Send cursor position to server when it changes
    // editor.on('selection-change', range => {
    //     if (range) {
    //         const message = JSON.stringify({
    //             type: 'cursor',
    //             username: username,
    //             range: range.index, // Send only the index of the cursor position
    //             length: range.length // Send the length of the selection
    //         });
    //         socket.send(message);
    //     }
    // });

    // Print text content to console when changed
    // ytext.observe(() => {
    //     const content = ytext.toString();
    //     console.log('Text content:', content);

    //     // Send the content to the server when text changes
    //     sendMessageToServer(content);
    // });

    // Function to send message to server
    function sendMessageToServer(message) {
        // Send 'message' to the server via WebSocket
        // You can send the message here using provider.ws.send()
        // Example: provider.ws.send(message);
        provider.ws.send(message)
    }

    // @ts-ignore
    window.example = { provider, ydoc, ytext, binding, Y }
})