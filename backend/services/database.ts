import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

function connectDB() {
    const dbUsername = process.env.DB_USERNAME || "";
    const dbPassword = process.env.DB_PASSWORD || "";
    const dbName = process.env.DB_NAME || "";
    const dbHost = process.env.DB_HOST || "localhost:27017";

    let connectionString = "mongodb://";
    if (dbUsername && dbPassword) {
        connectionString += `${dbUsername}:${dbPassword}@`;
    }
    connectionString += `${dbHost}`;
    if (dbName) {
        connectionString += `/${dbName}`;
    }

    console.log("connection string:", connectionString);
    console.log("attempting to connect to database");
    mongoose.connect(connectionString, {
        authSource: "admin",
    }).then(() => console.log("Database connection established"))
        .catch((err) => {
            console.error('An unknown error occurred', err);
            process.exit(1);
        })
}

export function closeDbConnection() {
    mongoose.connection.close().then(() => {
        console.log("Db connection closed");
        process.exit(0);
    })
}

export default connectDB;
