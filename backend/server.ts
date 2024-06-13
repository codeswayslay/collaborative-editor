import express from "express";
import session from "express-session";
import passport from "passport";
import bodyParser from "body-parser";
import WebSocket from "ws";
import http from "http";
import path from "path";
import flash from "connect-flash";
import { monitorOrchastration, setupOrchastration } from "./services/orchestrator"
import { createUser } from "./services/userService";
import dotenv from "dotenv"
import connectDB from "./services/database"
import {
    findDocumentById,
    saveDocument,
    getDocumentById,
    getDocumentsByUserId,
    updateDocumentById
} from "./services/documentService";
import UserModel, { IUserDocument } from "./models/User"
import "./services/authService"
import { IDocument } from "./models/Document";

dotenv.config();

const port = 4000;

const app = express();
const httpServer = http.createServer(app);

// Session
app.use(session({
    secret: "123456789abcdefghijklmnopqrstuvwxyz",
    resave: false,
    saveUninitialized: true
}));

app.use(flash());
app.use(bodyParser.urlencoded({ extended: true })); // Parses form data
app.use(bodyParser.json()); // Parses JSON data
// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

//setup view engine - ejs
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.set("view engine", "ejs")

//setup css
app.use(express.static(path.join(__dirname, '../views')));
app.use("/css", express.static(path.join(__dirname, "../node_modules", "bootstrap", "dist", "css")));
app.use("/dist", express.static(path.join(__dirname, "../dist")));

// Middleware to pass flash messages to the views
app.use((req, res, next) => {
    res.locals.message = req.flash();
    next();
});

app.get("/health", (req, res) => {
    res.json({ response: "ok" });
});

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: IUserDocument, info: any) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', 'The username or password is invalid');
            return res.redirect("/login");
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect("/document-list");
        });
    })(req, res, next);
});

app.get("/register", (req, res) => {
    res.render("register");
})

app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (username.length < 1 || password.length < 1) {
        req.flash('error', 'Username and password must be provided');
        return res.redirect('/register');
    }

    try {
        const user = await createUser(username, password);
        req.login(user as IUserDocument, (err) => {
            if (err) {
                req.flash('error', 'Something went wrong with your registration.');
                console.error(err);
                return res.redirect('/register');
            }
            return res.redirect('/document-list');
        });
    } catch (err) {
        req.flash('error', 'Username probably already exists.');
        console.error(err);
        res.redirect('/register');
    }
});

app.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/login");
    });
});

app.get("/editor", async (req, res, next) => {
    const { id } = req.query;
    const doc = await findDocumentById(id as string);
    if (!doc) {
        return res.render('error', { message: 'Invalid document ID' });
    }

    // Fetch user details
    const user = req.isAuthenticated() ? req.user as IUserDocument : null;
    if (!user) {
        return res.redirect("/login");
    }

    res.render('editor', {
        username: user.username,
        userId: user._id,
        documentId: id,
        ownerId: (doc as IDocument).userId
    });
});

app.get("/document-list", async (req, res, next) => {
    if (req.isAuthenticated()) {
        const documents = await getDocumentsByUserId(String((req.user as IUserDocument)._id));
        res.render('document-list', { documents });
    } else {
        res.redirect('/login');
    }
});

app.post('/create-document', async (req, res) => {
    const { documentName } = req.body;
    console.log("document name:", documentName);
    if (req.isAuthenticated()) {
        await saveDocument('content', documentName, '', String((req.user as IUserDocument)._id));
        res.redirect('/document-list');
    } else {
        res.redirect('/login');
    }
});

//frontend editor will call this to get logged in user's details
app.get("/user", (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: "Not authenticated" });
    }
});

// Assuming you have a route like this in your Express app
app.get('/documents/:documentId/content', async (req, res) => {
    const documentId = req.params.documentId;
    try {
        const documentContent = await getDocumentById(documentId);
        res.json({ content: documentContent });
    } catch (error) {
        console.error("Error fetching document content:", error);
        res.status(500).json({ error: "Failed to fetch document content" });
    }
});

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/document-list");
    } else {
        res.redirect("/login");
    }
});

async function startServer() {
    try {
        connectDB();


        //setup websocket orchastrator for document
        let id = setupOrchastration(httpServer);

        //monitor orchastrator
        monitorOrchastration(port, id);

        httpServer.listen(port, () => {
            console.log(`Listening to http://localhost:${port}`);
        });
    } catch (err) {
        console.log('Failed to connect to database:', err);
        process.exit(1); // Exit the process if database connection fails
    }
};

// Start the server
startServer();