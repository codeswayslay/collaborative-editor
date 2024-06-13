import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"
import { QuillBinding } from "y-quill"
import Quill from "quill"
import QuillCursors from "quill-cursors"

Quill.register("modules/cursors", QuillCursors)

window.addEventListener("load", async () => {
    console.log(`Begun session for ${username} on document: ${documentId}`)

    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider(
        "ws://localhost:4000/documents",
        documentId,
        ydoc
    )
    const ytext = ydoc.getText(documentId)
    const editorContainer = document.createElement("div")
    editorContainer.setAttribute("id", "editor")
    document.body.insertBefore(editorContainer, null)

    const editor = new Quill(editorContainer, {
        modules: {
            cursors: true,
            toolbar: [
                [{ header: [1, 2, false] }],
                ["bold", "italic", "underline"],
                ["image", "code-block"]
            ],
            history: {
                userOnly: true
            }
        },
        placeholder: "What's on your mind...",
        theme: "snow"
    })

    const binding = new QuillBinding(ytext, editor, provider.awareness)

    //cursor coloring
    const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
    provider.awareness.setLocalStateField("user", {
        name: username,
        color: color
    })

    // Fetch document content
    const response = await fetch(`/documents/${documentId}/content`);
    if (response.ok) {
        const data = await response.json();
        const documentContent = data.content;
        console.log("retrieved:", documentContent)

        if (documentContent.data.length > 0) editor.setText(documentContent.data);
    } else {
        console.error("Failed to fetch document content");
    }

    // const connectBtn = document.getElementById("y-connect-btn")
    // connectBtn?.addEventListener("click", () => {
    //     if (provider.shouldConnect) {
    //         provider.disconnect()
    //         connectBtn.textContent = "Connect"
    //     } else {
    //         provider.connect()
    //         connectBtn.textContent = "Disconnect"
    //     }
    // })

    const saveAndExitBtn = document.getElementById("y-exit-btn");
    saveAndExitBtn?.addEventListener("click", async () => {
        console.log("disconnected!")
        // Disconnect from the WebSocket provider and redirect user to document lis
        provider.disconnect();
        window.location.href = "/document-list";
    });

    // Send editor content to server when it changes
    ytext.observe((event, transaction) => {
        if (transaction.origin) {
            const content = ytext.toString();
            const message = JSON.stringify({ type: "content", data: content });
            console.log(message)
            sendMessageToServer(message);
        }
    });

    // Function to send message to server
    function sendMessageToServer(message) {
        provider.ws.send(message)
    }

    // Undo and Redo functionality 
    const undoButton = document.getElementById("undo-btn");
    const redoButton = document.getElementById("redo-btn");

    undoButton.addEventListener("click", () => {
        editor.history.undo();
    });

    redoButton.addEventListener("click", () => {
        editor.history.redo();
    });

    //close connection when browser closes
    window.addEventListener('beforeunload', () => {
        provider.disconnect();
        console.log('WebSocket connection closed');
    });


    //for debugging - do not touch
    window.example = { provider, ydoc, ytext, binding, Y }
})