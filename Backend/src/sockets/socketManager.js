import { Server } from "socket.io";
//turns your normal Node server into a real-time server
let timeOnline = {};
export const connectToSocket = (server) => {

    const io = new Server(server, {
        cors: {   //Takes your HTTP server
                  // Attaches Socket.IO to it
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => { //runs every time a new user connects
        console.log("User connected:", socket.id);

        const updateRoomUsers = (roomId) => {
            const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
            if (clients.length === 0) return;
            const hostId = clients[0];
            const users = clients.map(cid => {
                const clientSocket = io.sockets.sockets.get(cid);
                return {
                    id: cid,
                    username: clientSocket ? clientSocket.username : `User (${cid.slice(0, 5)})`,
                    isHost: cid === hostId
                };
            });
            io.to(roomId).emit("room-users", users);
        };

        // =========================
        // JOIN CALL
        // =========================
        socket.on("join-call", (roomId, username) => {
            socket.join(roomId);
            socket.roomId = roomId;
            socket.username = username || `User (${socket.id.slice(0, 5)})`;
            timeOnline[socket.id] = new Date();
            console.log(`${socket.username} (${socket.id}) joined room ${roomId}`);

            // notify others (excluding self)
            socket.to(roomId).emit("user-joined", socket.id, socket.username);

            // Send updated participant list
            updateRoomUsers(roomId);
        });

        // =========================
        // SIGNAL (WebRTC)
        // =========================
        socket.on("signal", ({ to, message }) => {
            io.to(to).emit("signal", {
                from: socket.id,
                message
            });
        });

        // =========================
        // CHAT MESSAGE
        // =========================
        socket.on("chat-message", (message) => {
            const roomId = socket.roomId;
            if (!roomId) return;

            // Broadcast to other users in the room (excluding sender)
            socket.to(roomId).emit("chat-message", {
                message,
                sender: socket.id,
                username: socket.username || `User (${socket.id.slice(0, 5)})`
            });
        });

        // =========================
        // HOST MODERATION
        // =========================
        socket.on("mute-user", ({ roomId, targetUserId }) => {
            const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
            if (clients[0] === socket.id) {
                io.to(targetUserId).emit("mute-instruction");
            }
        });

        socket.on("kick-user", ({ roomId, targetUserId }) => {
            const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
            if (clients[0] === socket.id) {
                io.to(targetUserId).emit("kick-instruction");
            }
        });

        // =========================
        // DISCONNECT
        // =========================
        socket.on("disconnect", () => {
            const roomId = socket.roomId;
            if (!roomId) return;

            console.log(`${socket.id} left room ${roomId}`);
            const joinTime = timeOnline[socket.id];
            const timeSpent = new Date() - joinTime;

            console.log("Time spent (ms):", timeSpent);
            console.log("Time spent (sec):", Math.floor(timeSpent / 1000));

            delete timeOnline[socket.id];
            socket.to(roomId).emit("user-left", socket.id);

            // Send updated participant list to remaining users
            updateRoomUsers(roomId);
        });

    });

    return io;
};
