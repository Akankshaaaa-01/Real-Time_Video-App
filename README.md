# 🎥 Meetrix — Real-Time Video Conferencing App

A full-stack real-time video conferencing application built with **React**, **Node.js**, **Socket.IO**, and **WebRTC**. Supports multi-party video calls, live chat, screen sharing, meeting recording, and host moderation controls.

---

## ✨ Features

- 🔐 **JWT Authentication** — Register, Login, and Protected Routes
- 📹 **Multi-Party Video Calls** — WebRTC peer-to-peer connections for multiple participants
- 💬 **Real-Time Chat** — In-meeting chat panel via Socket.IO
- 🖥️ **Screen Sharing** — Share your screen with all participants
- 🎙️ **Mic & Camera Toggle** — Mute/unmute and enable/disable camera
- ⏺️ **Meeting Recording** — Record and download the session as `.webm`
- 👑 **Host Moderation** — Host can mute or kick any participant
- 📋 **Participant Panel** — Live list of all participants with host badge
- 📅 **Meeting History** — Past meetings saved and shown in Lobby
- 🔗 **Shareable Meeting Links** — Join via meeting ID or direct URL

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 18 + Vite | UI Framework |
| React Router v6 | Client-side routing |
| Socket.IO Client | Real-time communication |
| WebRTC | Peer-to-peer video/audio |
| Axios | HTTP requests |
| Tailwind CSS | Styling |
| React Icons | Icon library |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | REST API server |
| Socket.IO | WebSocket server |
| MongoDB + Mongoose | Database |
| JWT | Authentication tokens |
| bcrypt | Password hashing |
| Nodemon | Dev auto-restart |

---

## 📁 Project Structure

```
VideoApp/
├── Backend/
│   ├── app.js                        # Express + Socket.IO entry point
│   ├── .env                          # Environment variables
│   └── src/
│       ├── controllers/
│       │   └── user.controller.js    # Auth & activity logic
│       ├── models/
│       │   ├── user.model.js         # User schema
│       │   └── meeting.model.js      # Meeting history schema
│       ├── routes/
│       │   └── users.routes.js       # API routes
│       └── sockets/
│           └── socketManager.js      # Socket.IO event handlers
│
└── Frontend/
    └── src/
        ├── pages/
        │   ├── landing.jsx           # Landing/home page
        │   ├── authentication.jsx    # Login & Register
        │   ├── Lobby.jsx             # Meeting lobby + history
        │   └── VideoMeet.jsx         # Main video call room
        ├── components/
        │   ├── ControlBar.jsx        # Call control buttons
        │   ├── ChatPanel.jsx         # In-call chat
        │   └── ParticipantPanel.jsx  # Participants list
        └── contexts/
            └── AuthContext.jsx       # Global auth state
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository
```bash
git clone https://github.com/Akankshaaaa-01/Real-Time_Video-App.git
cd Real-Time_Video-App
```

### 2. Setup Backend
```bash
cd Backend
npm install
```

Create a `.env` file in `Backend/`:
```env
PORT=8000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Start the backend:
```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd Frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/users/register` | Register new user |
| `POST` | `/api/v1/users/login` | Login user, returns JWT |
| `POST` | `/api/v1/users/add_to_activity` | Log a meeting visit |
| `GET` | `/api/v1/users/get-all_activity` | Get user's meeting history |

---

## 🔌 Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-call` | Client → Server | Join a meeting room |
| `user-joined` | Server → Client | New participant joined |
| `signal` | Both | WebRTC signaling (offer/answer/ICE) |
| `chat-message` | Both | Send/receive chat messages |
| `room-users` | Server → Client | Updated participant list |
| `user-left` | Server → Client | Participant disconnected |
| `mute-user` | Client → Server | Host mutes a participant |
| `kick-user` | Client → Server | Host kicks a participant |
| `mute-instruction` | Server → Client | Targeted user gets muted |
| `kick-instruction` | Server → Client | Targeted user gets kicked |

---

## 📸 App Flow

```
Landing Page → Auth (Login/Register) → Lobby → Video Room
                                          ↑
                               Meeting History (Rejoin)
```

---

## 📄 License

MIT License — feel free to use and modify.

---

> Built with ❤️ by [Akanksha](https://github.com/Akankshaaaa-01)
