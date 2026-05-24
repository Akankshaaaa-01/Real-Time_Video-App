import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

export default function Lobby() {
    const [meetingId, setMeetingId] = useState("");
    const navigate = useNavigate();
    const { token, logout } = useAuth();
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) return;
            try {
                const res = await axios.get(`http://localhost:8000/api/v1/users/get-all_activity?token=${token}`);
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to fetch meeting history:", err.message);
            }
        };
        fetchHistory();
    }, [token]);

    const createMeeting = () => {
        const id = Math.random().toString(36).substring(2, 10);
        navigate(`/meet/${id}`);
    };

    const joinMeeting = () => {
        if (!meetingId.trim()) return;
        navigate(`/meet/${meetingId.trim()}`);
    };

    return (
        <div className="relative min-h-screen flex flex-col text-white">

            {/* Background */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0f172a] via-[#020617] to-black" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Header */}
            <header className="flex justify-between items-center px-6 md:px-12 py-5 bg-black/10 backdrop-blur-sm border-b border-white/5">
                <h1 className="text-2xl font-bold text-blue-400 cursor-pointer" onClick={() => navigate("/")}>Meetrix</h1>
                <button 
                    onClick={logout}
                    className="px-4 py-2 bg-red-600/80 hover:bg-red-500 rounded-xl text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                >
                    Logout
                </button>
            </header>

            {/* Main Section */}
            <main className="flex-grow flex items-center justify-center p-6">
                <div className="flex flex-col lg:flex-row gap-8 max-w-6xl w-full justify-center items-stretch">
                    
                    {/* Left Panel: Actions */}
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col justify-center gap-6 shadow-xl h-fit">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-blue-300">Welcome to Lobby</h2>
                            <p className="text-gray-400 mt-1 text-sm">Start a new call or enter a meeting ID to join.</p>
                        </div>

                        <button
                            onClick={createMeeting}
                            className="w-full bg-blue-600 hover:bg-blue-500 transition-all py-3.5 rounded-xl font-bold text-sm shadow-md active:scale-95 cursor-pointer"
                        >
                            + Start New Meeting
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-[1px] bg-white/10" />
                            <span className="text-gray-400 text-xs">OR</span>
                            <div className="flex-1 h-[1px] bg-white/10" />
                        </div>

                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Enter meeting ID"
                                value={meetingId}
                                onChange={(e) => setMeetingId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && joinMeeting()}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-400 outline-none transition-all placeholder-gray-500 text-sm"
                            />
                            <button
                                onClick={joinMeeting}
                                className="w-full bg-green-600 hover:bg-green-500 transition-all py-3.5 rounded-xl font-bold text-sm shadow-md active:scale-95 cursor-pointer"
                            >
                                Join Meeting
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: History */}
                    <div className="flex-[1.5] bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-5 shadow-xl min-h-[400px]">
                        <h2 className="text-xl font-bold text-blue-400 border-b border-white/10 pb-2">
                            Meeting History
                        </h2>
                        
                        <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-3 max-h-[380px]">
                            {history.length === 0 ? (
                                <div className="text-center text-gray-500 py-16 text-sm">
                                    No past meetings found
                                </div>
                            ) : (
                                history.map((h, i) => (
                                    <div 
                                        key={i} 
                                        className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/10 hover:border-blue-500/30 transition-all cursor-pointer group"
                                        onClick={() => navigate(`/meet/${h.meetingCode}`)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-all">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors text-sm">
                                                    Meeting ID: {h.meetingCode}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    {new Date(h.date).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold bg-blue-500/20 text-blue-300 group-hover:bg-blue-600 group-hover:text-white px-3 py-1.5 rounded-lg transition-all">
                                            Rejoin
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}