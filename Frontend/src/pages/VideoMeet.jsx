import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

import ChatPanel from "../components/ChatPanel";
import ParticipantPanel from "../components/ParticipantPanel";
import ControlBar from "../components/ControlBar";

// =========================================================================
// NEW: VideoPlayer Helper Component
// =========================================================================
// React does not natively support binding MediaStream directly via attributes (e.g. src={stream}).
// This component binds a raw WebRTC MediaStream to the video element's source object
// dynamically when the stream updates using a Ref and a useEffect hook.
function VideoPlayer({ stream, muted = false, className = "" }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className={className}
        />
    );
}

export default function VideoMeet() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, username } = useAuth();

    const localVideoRef = useRef(null);
    const localStream = useRef(null);
    
    // =========================================================================
    // CHANGED: Connection Map & Multi-Stream state
    // =========================================================================
    // Instead of a single peerConnection ref and a single remoteVideoRef, we now
    // maintain a dictionary map of active connections: { [socketId]: RTCPeerConnection }.
    const peerConnections = useRef({}); 
    const socketRef = useRef(null);

    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    const [joined, setJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [messages, setMessages] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    
    // CHANGED: State array to track all active participant video/audio streams.
    // Format: [{ id: socketId, stream: MediaStream }]
    const [remoteStreams, setRemoteStreams] = useState([]);

    // Initialize Socket connection once on component mount
    useEffect(() => {
        socketRef.current = io("http://localhost:8000");

        return () => {
            socketRef.current?.disconnect(); // cleanup socket connection on unmount
        };
    }, []);

    // Log the user activity inside MongoDB
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

    // Request permissions for audio/video media devices and notify room
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

                socketRef.current.emit("join-call", id, username);
                setJoined(true);
            } catch (err) {
                console.error("Error accessing media devices:", err);
            }
        };

        startVideoAndJoin();

        return () => {
            // Clean up and stop user tracks and close all active WebRTC connections
            localStream.current?.getTracks().forEach(t => t.stop());
            Object.values(peerConnections.current).forEach(pc => pc.close());
            peerConnections.current = {};
        };
    }, [id]);

    // =========================================================================
    // CHANGED: Peer Connection Factory
    // =========================================================================
    // Refactored to generate a distinct RTCPeerConnection instance for a targeted participant socket.
    const createPeerConnection = useCallback((targetUserId) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" }
            ]
        });

        // Add local tracks (camera/mic) to the connection
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => {
                pc.addTrack(track, localStream.current);
            });
        }

        // When a remote media stream track is received, append it to remoteStreams state array
        pc.ontrack = (event) => {
            const incomingStream = event.streams[0];
            setRemoteStreams(prev => {
                // Skip if this stream has already been logged
                if (prev.some(s => s.id === targetUserId)) {
                    return prev;
                }
                return [...prev, { id: targetUserId, stream: incomingStream }];
            });
        };

        // When a local ICE candidate is fetched, emit it specifically to the remote peer (targetUserId)
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit("signal", {
                    to: targetUserId,
                    message: event.candidate
                });
            }
        };

        return pc;
    }, []);

    // Configure WebRTC signaling listeners
    useEffect(() => {
        if (!joined || !socketRef.current) return;

        const socket = socketRef.current;

        // =========================================================================
        // CHANGED: Initiate WebRTC call flow when a new user joins
        // =========================================================================
        const handleUserJoined = async (userId) => {
            console.log("New participant joined. Initializing connection:", userId);
            const pc = createPeerConnection(userId);
            peerConnections.current[userId] = pc;

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit("signal", { to: userId, message: offer });
        };

        // =========================================================================
        // CHANGED: Multi-party signal handler (Offer/Answer/ICE routing)
        // =========================================================================
        const handleSignal = async ({ from, message }) => {
            let pc = peerConnections.current[from];

            if (message.type === "offer") {
                console.log("Received RTC offer from:", from);
                // Create connection instance on-demand if it doesn't exist yet
                if (!pc) {
                    pc = createPeerConnection(from);
                    peerConnections.current[from] = pc;
                }
                await pc.setRemoteDescription(message);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit("signal", { to: from, message: answer });

            } else if (message.type === "answer") {
                console.log("Received RTC answer from:", from);
                if (pc) {
                    await pc.setRemoteDescription(message);
                }

            } else if (message.candidate) {
                if (pc) {
                    await pc.addIceCandidate(message);
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

        // =========================================================================
        // CHANGED: Cleanup peer connection when user leaves
        // =========================================================================
        const handleUserLeft = (userId) => {
            console.log("Participant disconnected:", userId);
            if (peerConnections.current[userId]) {
                peerConnections.current[userId].close();
                delete peerConnections.current[userId];
            }
            // Remove stream from state list so the video box unmounts in the UI
            setRemoteStreams(prev => prev.filter(s => s.id !== userId));
        };

        const handleRoomUsers = (usersList) => {
            setParticipants(usersList);
        };

        const handleMuteInstruction = () => {
            const audioTrack = localStream.current?.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = false;
                setIsMuted(true);
                alert("You have been muted by the host.");
            }
        };

        const handleKickInstruction = () => {
            alert("You have been kicked out by the host.");
            leaveMeeting();
        };

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

    const toggleMute = () => {
        const audioTrack = localStream.current?.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    };

    const toggleCamera = () => {
        const videoTrack = localStream.current?.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsCameraOff(!videoTrack.enabled);
        }
    };

    // =========================================================================
    // CHANGED: Screen Sharing for multiple active peer connections
    // =========================================================================
    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const track = stream.getVideoTracks()[0];

            // Loop and replace video track on all active connections to update their video feed
            Object.values(peerConnections.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === "video");
                if (sender) sender.replaceTrack(track);
            });

            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            track.onended = () => {
                if (localStream.current && localVideoRef.current) {
                    localVideoRef.current.srcObject = localStream.current;
                    const videoTrack = localStream.current.getVideoTracks()[0];
                    
                    // Loop to restore camera track across all active connections
                    Object.values(peerConnections.current).forEach(pc => {
                        const currentSender = pc.getSenders().find(s => s.track?.kind === "video");
                        if (currentSender && videoTrack) currentSender.replaceTrack(videoTrack);
                    });
                }
            };
        } catch (err) {
            console.error("Screen share error:", err);
        }
    };

    const leaveMeeting = () => {
        Object.values(peerConnections.current).forEach(pc => pc.close());
        peerConnections.current = {};
        socketRef.current?.disconnect();
        navigate("/lobby");
    };

    const handleSendMessage = (text) => {
        socketRef.current.emit("chat-message", text);
        setMessages(prev => [...prev, { text, sender: "me", username: "You" }]);
    };

    const handleMuteUser = (targetUserId) => {
        socketRef.current.emit("mute-user", { roomId: id, targetUserId });
    };

    const handleKickUser = (targetUserId) => {
        socketRef.current.emit("kick-user", { roomId: id, targetUserId });
    };

    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.state !== "inactive" && mediaRecorderRef.current.stop();
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                recordedChunksRef.current = [];

                const recorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });

                recorder.ondataavailable = (e) => {
                    if (e.data?.size > 0) recordedChunksRef.current.push(e.data);
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

    // Helper function to resolve user names for the video overlays
    const getParticipantName = (socketId) => {
        const user = participants.find(p => p.id === socketId);
        return user ? user.username : `User (${socketId.slice(0, 5)})`;
    };

    return (
        <div className="h-screen bg-[#020617] text-white relative overflow-hidden">
            {showChat && (
                <ChatPanel
                    messages={messages}
                    remoteUserName=""
                    onSendMessage={handleSendMessage}
                    onClose={() => setShowChat(false)}
                />
            )}

            {showParticipants && (
                <ParticipantPanel
                    participants={participants}
                    currentSocketId={socketRef.current?.id}
                    onMuteUser={handleMuteUser}
                    onKickUser={handleKickUser}
                    onClose={() => setShowParticipants(false)}
                />
            )}

            {/* Full-screen video grid — fills everything above the ControlBar */}
            <div className="absolute inset-0 bottom-[88px] bg-black p-2 gap-2 overflow-hidden">
                <div className={`grid h-full w-full gap-2 ${
                    remoteStreams.length === 0
                        ? "grid-cols-1"
                        : remoteStreams.length === 1
                        ? "grid-cols-2"
                        : remoteStreams.length <= 3
                        ? "grid-cols-2"
                        : "grid-cols-2 lg:grid-cols-3"
                }`}>
                    {/* Local Participant Box */}
                    <div className="relative bg-slate-900 border-2 border-blue-500 rounded-xl overflow-hidden shadow-lg min-h-0">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-semibold">
                            You {username ? `(${username})` : ""}
                        </div>
                    </div>

                    {/* Remote Participant Boxes */}
                    {remoteStreams.map((item) => (
                        <div key={item.id} className="relative bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-lg min-h-0 hover:border-blue-400/40 transition-colors">
                            <VideoPlayer
                                stream={item.stream}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-semibold">
                                {getParticipantName(item.id)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="fixed top-5 left-5 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg z-50 border border-white/5 font-semibold text-sm shadow-md">
                Meeting ID: {id}
            </div>

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