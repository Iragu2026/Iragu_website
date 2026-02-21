import dns from "node:dns";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "backend/config/config.env" });
const db = process.env.DB_URI || "mongodb://localhost:27017/webdev";
const dnsServers = String(process.env.DNS_SERVERS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (dnsServers.length) {
  dns.setServers(dnsServers);
}

export const connectMongoDatabase = () => {
    mongoose.set("strictQuery", true);
    mongoose.connect(db).then((data) => {
        console.log(`Connected to MongoDB: ${data.connection.host}`);
    }).catch((err) => {
        console.error(`Error connecting to MongoDB: ${err.message}`);
        process.exit(1);
    });
}

