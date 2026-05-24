import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

// Modular subcomponents
import ChatPanel from "../components/ChatPanel";
import ParticipantPanel from "../components/ParticipantPanel";
import ControlBar from "../components/ControlBar";

const socket = io("http://localhost:8000");

export default function VideoMeet() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, username } = useAuth();

    // WebRTC refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStream = useRef(null);
    const peerConnection = useRef(null);
    const remoteUserIdRef = useRef(null);

    // Recording refs
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    // States
    const [joined, setJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [messages, setMessages] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [remoteUserName, setRemoteUserName] = useState("Remote User");

    // Log meeting in activity history on entry
    useEffect(() => {
        const logActivity = async () => {
            if (!token || !id) return;
            try {
                await axios.post("http://localhost:8000/api/v1/users/add_to_activity", {
                    token,
                    meeting_code: id
                });
            } catch (err) {
                console.error("Failed to log activity:", err.message);
            }
        };
        logActivity();
    }, [token, id]);

    // 🎥 Start local camera & microphone streams
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

                console.log("Auto-joining room:", id, username);
                socket.emit("join-call", id, username);
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
        };
    }, [id]);

    // ⚙️ Create Peer Connection (WebRTC)
    const createPeerConnection = useCallback(() => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" }
            ]
        });

        if (localStream.current) {
            localStream.current.getTracks().forEach(track => {
                pc.addTrack(track, localStream.current);
            });
        }

        pc.ontrack = (event) => {
            console.log("Received remote track");
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && remoteUserIdRef.current) {
                socket.emit("signal", {
                    to: remoteUserIdRef.current,
                    message: event.candidate
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", pc.iceConnectionState);
        };

        return pc;
    }, []);

    // 🔌 Setup Socket Listeners
    useEffect(() => {
        if (!joined) return;

        const handleUserJoined = async (userId) => {
            console.log("👤 User joined:", userId);
            remoteUserIdRef.current = userId;
            
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
        };

        const handleSignal = async ({ from, message }) => {
            if (message.type === "offer") {
                remoteUserIdRef.current = from;
                
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
            } else if (message.type === "answer") {
                if (peerConnection.current) {
                    await peerConnection.current.setRemoteDescription(message);
                }
            } else if (message.candidate) {
                if (peerConnection.current) {
                    await peerConnection.current.addIceCandidate(message);
                }
            }
        };

        const handleChatMessage = ({ message, sender, username: senderName }) => {
            setMessages(prev => [...prev, {
                text: message,
                sender: sender === socket.id ? "me" : "them",
                username: senderName
            }]);
        };

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

        const handleRoomUsers = (usersList) => {
            setParticipants(usersList);
            const otherUser = usersList.find(u => u.id !== socket.id);
            if (otherUser) {
                setRemoteUserName(otherUser.username || "Remote User");
            }
        };

        const handleMuteInstruction = () => {
            if (localStream.current) {
                const audioTrack = localStream.current.getAudioTracks()[0];
                if (audioTrack) {
                    audioTrack.enabled = false;
                    setIsMuted(true);
                    alert("You have been muted by the host.");
                }
            }
        };

        const handleKickInstruction = () => {
            alert("You have been kicked out of the meeting by the host.");
            leaveMeeting();
        };

        // Bind events
        socket.on("user-joined", handleUserJoined);
        socket.on("signal", handleSignal);
        socket.on("chat-message", handleChatMessage);
        socket.on("user-left", handleUserLeft);
        socket.on("room-users", handleRoomUsers);
        socket.on("mute-instruction", handleMuteInstruction);
        socket.on("kick-instruction", handleKickInstruction);

        return () => {
            socket.off("user-joined", handleUserJoined);
            socket.off("signal", handleSignal);
            socket.off("chat-message", handleChatMessage);
            socket.off("user-left", handleUserLeft);
            socket.off("room-users", handleRoomUsers);
            socket.off("mute-instruction", handleMuteInstruction);
            socket.off("kick-instruction", handleKickInstruction);
        };
    }, [joined, createPeerConnection, id]);

    // 🎤 Toggle Microphone Mute
    const toggleMute = () => {
        if (localStream.current) {
            const audioTrack = localStream.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    // 📷 Toggle Camera On/Off
    const toggleCamera = () => {
        if (localStream.current) {
            const videoTrack = localStream.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
            }
        }
    };

    // 📺 Start Screen Share
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

            track.onended = () => {
                if (localStream.current && localVideoRef.current) {
                    localVideoRef.current.srcObject = localStream.current;
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

    // 🚪 Leave Meeting
    const leaveMeeting = () => {
        if (peerConnection.current) {
            peerConnection.current.close();
        }
        socket.disconnect();
        navigate("/lobby");
    };

    // 💬 Send Chat Message
    const handleSendMessage = (text) => {
        socket.emit("chat-message", text);
        setMessages(prev => [...prev, {
            text,
            sender: "me",
            username: "You"
        }]);
    };

    // 👑 Host Moderation Handlers
    const handleMuteUser = (targetUserId) => {
        socket.emit("mute-user", { roomId: id, targetUserId });
    };

    const handleKickUser = (targetUserId) => {
        socket.emit("kick-user", { roomId: id, targetUserId });
    };

    // 🔴 Recording Control Handler
    const toggleRecording = async () => {
        if (isRecording) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });

                recordedChunksRef.current = [];
                const recorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });

                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) {
                        recordedChunksRef.current.push(e.data);
                    }
                };

                recorder.onstop = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.style.display = "none";
                    a.href = url;
                    a.download = `meeting-record-${id}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    URL.revokeObjectURL(url);
                    setIsRecording(false);
                    stream.getTracks().forEach(t => t.stop());
                };

                mediaRecorderRef.current = recorder;
                recorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Failed to start recording:", err);
            }
        }
    };

    return (
        <div className="h-screen bg-[#020617] text-white relative overflow-hidden">
            
            {/* Modular Chat Window */}
            {showChat && (
                <ChatPanel 
                    messages={messages} 
                    remoteUserName={remoteUserName} 
                    onSendMessage={handleSendMessage} 
                    onClose={() => setShowChat(false)}
                />
            )}

            {/* Modular Participant Directory & Host Controls */}
            {showParticipants && (
                <ParticipantPanel 
                    participants={participants} 
                    currentSocketId={socket.id} 
                    onMuteUser={handleMuteUser} 
                    onKickUser={handleKickUser} 
                    onClose={() => setShowParticipants(false)}
                />
            )}

            {/* Main Video Presentation Grid */}
            <div className="relative text-center h-screen flex items-center justify-center bg-black">
                <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline
                    className="w-full h-full object-contain" 
                />
                
                {/* Local Camera (PiP Overlay) */}
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute bottom-24 right-5 w-44 rounded-xl border-2 border-blue-500 z-10 shadow-lg cursor-pointer transition-all hover:scale-105"
                />
            </div>

            {/* Room Identifier Info Banner */}
            <div className="fixed top-5 left-5 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg z-50 border border-white/5 font-semibold text-sm shadow-md">
                Meeting ID: {id}
            </div>

            {/* Modular Control Buttons Bar */}
            <ControlBar 
                isMuted={isMuted}
                toggleMute={toggleMute}
                isCameraOff={isCameraOff}
                toggleCamera={toggleCamera}
                startScreenShare={startScreenShare}
                showChat={showChat}
                setShowChat={setShowChat}
                showParticipants={showParticipants}
                setShowParticipants={setShowParticipants}
                isRecording={isRecording}
                toggleRecording={toggleRecording}
                leaveMeeting={leaveMeeting}
            />
        </div>
    );
}