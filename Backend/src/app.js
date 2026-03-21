import dotenv from "dotenv";
dotenv.config();
import express from "express"
import mongoose from "mongoose"
import cors from "cors"


import { Server } from "socket.io"
import {createServer} from "node:http"
import { connectToSocket } from "./sockets/socketManager.js"

import userRoutes from "./routes/users.routes.js";
const app=express();
const MONGO_URL = process.env.MONGO_URL;
const server=createServer(app);
const io= connectToSocket(server);

app.set("port",(process.env.PORT||8000));
app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb",extended: true}))


app.use("/api/v1/users",userRoutes);

const startServer = async () => {
    try {
        const connectionDb=await mongoose.connect(MONGO_URL);
        console.log(`Connected to DB Host:${connectionDb.connection.host}`);

        server.listen(app.get("port"), () => {
            console.log(`Server running on port 8000`);
        });

    } catch (err) {
        console.error("DB Connection Failed:", err.message);
        process.exit(1); // stop app
    }
};


startServer();