import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Lobby() {

    const [meetingId, setMeetingId] = useState("");
    const navigate = useNavigate();

    const createMeeting = () => {
        const id = Math.random().toString(36).substring(2, 10);
        alert(`Meeting ID: ${id}`);
        navigate(`/meet/${id}`);
    };

    const joinMeeting = () => {
        if (!meetingId.trim()) return;
        navigate(`/meet/${meetingId}`);
    };

    return (
        <div className="relative h-screen flex items-center justify-center text-white">

            {/* 🌈 Background */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0f172a] via-[#020617] to-black" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* 🧊 Card */}
            <div className="w-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex flex-col gap-6 shadow-xl">

                {/* Heading */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-blue-400">Meetrix</h1>
                    <p className="text-gray-400 mt-1 text-sm">
                        Start or join a meeting instantly
                    </p>
                </div>

                {/* Create button */}
                <button
                    onClick={createMeeting}
                    className="w-full bg-blue-600 hover:bg-blue-500 transition-all py-3 rounded-xl font-semibold shadow-md"
                >
                    + Create New Meeting
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-[1px] bg-white/10" />
                    <span className="text-gray-400 text-sm">OR</span>
                    <div className="flex-1 h-[1px] bg-white/10" />
                </div>

                {/* Join section */}
                <div className="flex flex-col gap-3">
                    <input
                        type="text"
                        placeholder="Enter meeting ID"
                        value={meetingId}
                        onChange={(e) => setMeetingId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-400 outline-none transition-all placeholder-gray-500"
                    />

                    <button
                        onClick={joinMeeting}
                        className="w-full bg-green-600 hover:bg-green-500 transition-all py-3 rounded-xl font-semibold shadow-md"
                    >
                        Join Meeting
                    </button>
                </div>

            </div>
        </div>
    );
}