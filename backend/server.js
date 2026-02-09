import app from "./app.js";
import dotenv from "dotenv";
dotenv.config({ path: "backend/config/config.env" });

import { connectMongoDatabase } from "./config/db.js";
connectMongoDatabase();
// Handle Uncaught Exception
process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Uncaught Exception`);
    process.exit(1);
});

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

process.on("unHandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Unhandled Promise Rejection`);
    server.close(() => {
        process.exit(1);
    });
});