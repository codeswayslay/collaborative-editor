import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

function connectDB() {
    const dbUsername = process.env.DB_USERNAME;
    const dbPassword = process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME;
    const dbHost = process.env.DB_HOST;

    const connectionString = `mongodb://${dbUsername}:${dbPassword}@${dbHost}/${dbName}`;

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

export default connectDB;
