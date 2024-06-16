import express from "express";
import session from "express-session";
import passport from "passport";
import bodyParser from "body-parser";
import http from "http";
import path from "path";
import flash from "connect-flash";
import { monitorOrchastration, setupOrchastration, shutdownWebSocketServer } from "./services/orchestrator";
import dotenv from "dotenv"
import connectDB, { closeDbConnection } from "./services/database";

//routes
import authRouter from "./routes/auth";
import documentRouter from "./routes/document";
import contentRouter from "./routes/content";

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

//setup routes
app.use("/", authRouter);
app.use("/", documentRouter);
app.use("/", contentRouter);

app.get("/health", (req, res) => {
    res.json({ response: "ok" });
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

//graceful shutdown in docker
function gracefulShutdown() {
    console.log('Shutting down gracefully...');

    //shut down websocket
    shutdownWebSocketServer();

    //shut down server
    httpServer.close(() => {
        console.log('HTTP server closed');
        closeDbConnection();
    });

    // Forcefully shut down app if websocket / server hasn't closed after a delay
    setTimeout(() => {
        console.error('Forcefully shutting down');
        process.exit(1);
    }, 60000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);