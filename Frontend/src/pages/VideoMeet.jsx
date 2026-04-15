import { useEffect, useRef, useState, useCallback } from "react";
import WatchParty from "../pages/WatchParty"
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
    FaMicrophone, FaMicrophoneSlash,
    FaVideo, FaVideoSlash,
    FaDesktop, FaComments, FaPhoneSlash
} from "react-icons/fa";

const socket = io("http://localhost:8000");

export default function VideoMeet() {
    const { id } = useParams();
    const navigate = useNavigate();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStream = useRef(null);
    const peerConnection = useRef(null);
    const remoteUserIdRef = useRef(null);

    const [joined, setJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [remoteUserName, setRemoteUserName] = useState("Remote User");

    // 🎥 start camera and AUTO-JOIN
    useEffect(() => {
        const startVideoAndJoin = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                localStream.current = stream;

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Auto-join the meeting once camera is ready
                console.log("Auto-joining room:", id);
                socket.emit("join-call", id);
                setJoined(true);

            } catch (err) {
                console.error("Error accessing media devices:", err);
            }
        };

        startVideoAndJoin();

        return () => {
            if (localStream.current) {
                localStream.current.getTracks().forEach(t => t.stop());
            }
            if (peerConnection.current) {
                peerConnection.current.close();
            }
            // Don't disconnect socket here, let it stay connected
            // socket.disconnect(); // Remove this
        };
    }, [id]); // Add id as dependency

    // ⚙️ peer connection
    const createPeerConnection = useCallback(() => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" }
            ]
        });

        // Add all tracks from local stream
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => {
                pc.addTrack(track, localStream.current);
            });
        }

        pc.ontrack = (event) => {
            console.log("Received remote track");
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setRemoteUserName("Remote User");
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && remoteUserIdRef.current) {
                console.log("Sending ICE candidate");
                socket.emit("signal", {
                    to: remoteUserIdRef.current,
                    message: event.candidate
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", pc.iceConnectionState);
            if (pc.iceConnectionState === "connected") {
                console.log("✅ Peer connection established!");
            } else if (pc.iceConnectionState === "failed") {
                console.error("❌ ICE connection failed");
            }
        };

        return pc;
    }, []);

    // socket logic
    useEffect(() => {
        if (!joined) return;

        console.log("Setting up socket listeners for room:", id);

        // User joined handler
        const handleUserJoined = async (userId) => {
            console.log("👤 User joined:", userId);
            remoteUserIdRef.current = userId;
            
            // Close existing peer connection if any
            if (peerConnection.current) {
                peerConnection.current.close();
            }
            
            peerConnection.current = createPeerConnection();

            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);

            socket.emit("signal", {
                to: userId,
                message: offer
            });
            console.log("📤 Sent offer to:", userId);
        };

        // Signal handler
        const handleSignal = async ({ from, message }) => {
            console.log("📨 Received signal:", message.type || "candidate", "from:", from);
            
            if (message.type === "offer") {
                remoteUserIdRef.current = from;
                
                // Close existing peer connection if any
                if (peerConnection.current) {
                    peerConnection.current.close();
                }
                
                peerConnection.current = createPeerConnection();

                await peerConnection.current.setRemoteDescription(message);
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);

                socket.emit("signal", {
                    to: from,
                    message: answer
                });
                console.log("📤 Sent answer to:", from);

            } else if (message.type === "answer") {
                if (peerConnection.current) {
                    await peerConnection.current.setRemoteDescription(message);
                    console.log("✅ Remote description set");
                }

            } else if (message.candidate) {
                if (peerConnection.current) {
                    await peerConnection.current.addIceCandidate(message);
                    console.log("✅ ICE candidate added");
                }
            }
        };

        // Chat handler
        const handleChatMessage = ({ message, sender }) => {
            console.log("💬 Chat message received:", message);
            setMessages(prev => [...prev, {
                text: message,
                sender: sender === socket.id ? "me" : "them"
            }]);
        };

        // User left handler
        const handleUserLeft = (userId) => {
            console.log("👋 User left:", userId);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
            if (peerConnection.current) {
                peerConnection.current.close();
                peerConnection.current = null;
            }
            remoteUserIdRef.current = null;
            setRemoteUserName("Remote User");
        };

        socket.on("user-joined", handleUserJoined);
        socket.on("signal", handleSignal);
        socket.on("chat-message", handleChatMessage);
        socket.on("user-left", handleUserLeft);

        return () => {
            socket.off("user-joined", handleUserJoined);
            socket.off("signal", handleSignal);
            socket.off("chat-message", handleChatMessage);
            socket.off("user-left", handleUserLeft);
        };
    }, [joined, createPeerConnection, id]);

    // 🎤 mute
    const toggleMute = () => {
        if (localStream.current) {
            const audioTrack = localStream.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    // 📷 camera
    const toggleCamera = () => {
        if (localStream.current) {
            const videoTrack = localStream.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
            }
        }
    };

    // 📺 screen share
    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const track = stream.getVideoTracks()[0];

            const sender = peerConnection.current
                ?.getSenders()
                .find(s => s.track?.kind === "video");

            if (sender) {
                sender.replaceTrack(track);
            }

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            track.onended = async () => {
                if (localStream.current && localVideoRef.current) {
                    localVideoRef.current.srcObject = localStream.current;
                    
                    // Restore original video track in peer connection
                    const videoTrack = localStream.current.getVideoTracks()[0];
                    const currentSender = peerConnection.current
                        ?.getSenders()
                        .find(s => s.track?.kind === "video");
                    
                    if (currentSender && videoTrack) {
                        currentSender.replaceTrack(videoTrack);
                    }
                }
            };
        } catch (err) {
            console.error("Screen share error:", err);
        }
    };

    // 🚪 leave
    const leaveMeeting = () => {
        if (peerConnection.current) {
            peerConnection.current.close();
        }
        socket.disconnect();
        navigate("/lobby");
    };

    // 💬 send
    const sendMessage = () => {
        if (!input.trim()) return;

        socket.emit("chat-message", input);
        setMessages(prev => [...prev, {
            text: input,
            sender: "me"
        }]);
        setInput("");
    };

    return (
        <div style={{ height: "100vh", background: "#020617", color: "white", position: "relative" }}>
            {/* CHAT PANEL */}
            {showChat && (
                <div style={{
                    position: "fixed",
                    right: 0,
                    top: 0,
                    width: 320,
                    height: "100%",
                    background: "#0f172a",
                    borderLeft: "1px solid #1e293b",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 1000
                }}>
                    <div style={{
                        padding: "16px",
                        borderBottom: "1px solid #1e293b",
                        fontWeight: "bold",
                        background: "#0f172a"
                    }}>
                        Chat
                    </div>
                    
                    <div style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                    }}>
                        {messages.length === 0 && (
                            <div style={{ textAlign: "center", color: "#666", padding: "20px" }}>
                                No messages yet
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                textAlign: m.sender === "me" ? "right" : "left",
                                padding: "8px 12px",
                                background: m.sender === "me" ? "#3b82f6" : "#1e293b",
                                borderRadius: "8px",
                                maxWidth: "80%",
                                marginLeft: m.sender === "me" ? "auto" : "0",
                                wordBreak: "break-word"
                            }}>
                                <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "4px" }}>
                                    {m.sender === "me" ? "You" : remoteUserName}
                                </div>
                                {m.text}
                            </div>
                        ))}
                    </div>
                    
                    <div style={{
                        padding: "16px",
                        borderTop: "1px solid #1e293b",
                        display: "flex",
                        gap: "8px"
                    }}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder="Type a message..."
                            style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: "1px solid #1e293b",
                                background: "#1e293b",
                                color: "white",
                                outline: "none"
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            style={{
                                padding: "8px 16px",
                                background: "#3b82f6",
                                border: "none",
                                borderRadius: "6px",
                                color: "white",
                                cursor: "pointer"
                            }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}

            {/* VIDEO LAYOUT */}
            <div style={{ 
                position: "relative", 
                textAlign: "center", 
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#000"
            }}>
                <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline
                    style={{ 
                        width: "100%", 
                        height: "100%",
                        objectFit: "contain"
                    }} 
                />
                
                {/* Local Video (Picture-in-Picture) */}
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                        position: "absolute",
                        bottom: "80px",
                        right: "20px",
                        width: "180px",
                        borderRadius: "8px",
                        border: "2px solid #3b82f6",
                        zIndex: 10,
                        cursor: "pointer"
                    }}
                    onClick={() => {
                        // Optional: swap videos on click
                    }}
                />
            </div>

            {/* Meeting Info */}
            <div style={{
                position: "fixed",
                top: "20px",
                left: "20px",
                background: "rgba(0,0,0,0.7)",
                padding: "8px 16px",
                borderRadius: "8px",
                zIndex: 100
            }}>
                Meeting ID: {id}
            </div>

            {/* CONTROLS */}
            <div style={{
                position: "fixed",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "12px",
                background: "#1e293b",
                padding: "12px 24px",
                borderRadius: "50px",
                zIndex: 100
            }}>
                <button onClick={toggleMute} style={buttonStyle}>
                    {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
                </button>

                <button onClick={toggleCamera} style={buttonStyle}>
                    {isCameraOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
                </button>

                <button onClick={startScreenShare} style={buttonStyle}>
                    <FaDesktop size={20} />
                </button>

                <button onClick={() => setShowChat(p => !p)} style={{
                    ...buttonStyle,
                    background: showChat ? "#3b82f6" : "#1e293b"
                }}>
                    <FaComments size={20} />
                </button>

                <WatchParty socket={socket} roomId={id} />

                <button onClick={leaveMeeting} style={{...buttonStyle, background: "#ef4444"}}>
                    <FaPhoneSlash size={20} />
                </button>
            </div>
        </div>
    );
}

const buttonStyle = {
    background: "#1e293b",
    border: "none",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "white",
    transition: "all 0.2s",
    hover: {
        background: "#3b82f6"
    }
};