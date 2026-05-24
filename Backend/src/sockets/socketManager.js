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

// import { Server } from "socket.io";

// let connections = {};

// // connections = {
// //    "room1": ["socket1", "socket2"],
// //    "room2": ["socket3"]
// // }
// let messages = {};

// // messages = {
// //    "room1": [
// //       { sender: "socket1", data: "Hello" }
// //    ]
// // }

// let timeOnline = {}; //temporary in-memory store for user connection times
// // timeOnline = {
// //    "socket1": timeJoined
// // }

// export const connectToSocket = (server) => {

//     const io = new Server(server, {
//         cors: {
//             origin: "*",
//             methods: ["GET", "POST"],
//             allowedHeaders: ["*"],
//             credentials: true
//         }
//     });

//     io.on("connection", (socket) => {
//         console.log("User connected:", socket.id);

//         // =========================
//         // JOIN CALL
//         // =========================
//         socket.on("join-call", (path) => {
//             //client se emit hoga jab user call join karega, aur path bhejega jisme call join karna hai
//             // Jab user join-call karta hai, uska socket.id us room ke array mein add ho jaata hai, aur baaki sabko bataya jaata hai ki naya user aaya
//             if (!connections[path]) {
//                 connections[path] = [];
//             }

//             connections[path].push(socket.id);
//             timeOnline[socket.id] = new Date();

//             // notify users
//             connections[path].forEach((id) => {
//                 io.to(id).emit("user-joined", socket.id);
//             });
//         });

//         // =========================
//         // SIGNAL
//         // =========================
//         socket.on("signal", (toId, message) => {
//             //Signal event WebRTC ke liye hai — yeh directly ek user se dusre user ko data bhejta hai (camera/mic stream)
//             io.to(toId).emit("signal", socket.id, message);
//         });

//         // =========================
//         // CHAT MESSAGE
//         // =========================
//         socket.on("chat-message", (data) => {
//             // Jab user chat-message emit karta hai, toh pehle yeh check karta hai ki woh kis room mein hai, phir us room ke messages array mein message store karta hai, aur finally us room ke sab users ko message broadcast karta hai
//             let room = null;

//             // find room
//             for (let r in connections) {
//                 if (connections[r].includes(socket.id)) {
//                     room = r;
//                     break;
//                 }
//             }

//             if (!room) return;

//             if (!messages[room]) {
//                 messages[room] = [];
//             }

//             messages[room].push({
//                 sender: socket.id,
//                 data: data,
//                 "socket-id-sender": socket.id
//             });

//             console.log("message:", socket.id, data);

//             // broadcast message
//             connections[room].forEach((id) => {
//                 io.to(id).emit("chat-message", data, socket.id);
//             });
//         });

//         // =========================
//         // DISCONNECT
//         // =========================
//         socket.on("disconnect", () => {
//             //disconnect pe user ko remove kiya jaata hai, timeSpent calculate hota hai, aur agar room empty ho jaye to poora room cleanup ho jaata hai.
//             console.log("User disconnected:", socket.id);

//             let room = null;

//             for (let r in connections) {
//                 if (connections[r].includes(socket.id)) {
//                     room = r;
//                     break;
//                 }
//             }

//             if (!room) return;

//             // remove user
//             connections[room] = connections[room].filter(
//                 (id) => id !== socket.id
//             );

//             // time spent
//             let timeSpent = new Date() - timeOnline[socket.id];
//             console.log("Time online (ms):", timeSpent);

//             delete timeOnline[socket.id];

//             // notify others
//             connections[room].forEach((id) => {
//                 io.to(id).emit("user-left", socket.id);
//             });

//             // cleanup
//             if (connections[room].length === 0) {
//                 delete connections[room];
//                 delete messages[room];
//             }
//         });
//     });

//     return io;
// };