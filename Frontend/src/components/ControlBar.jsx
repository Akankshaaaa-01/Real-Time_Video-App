import {
    FaMicrophone, FaMicrophoneSlash,
    FaVideo, FaVideoSlash,
    FaDesktop, FaComments, FaPhoneSlash,
    FaUsers, FaCircle, FaStop
} from "react-icons/fa";

export default function ControlBar({
    isMuted, toggleMute,
    isCameraOff, toggleCamera,
    startScreenShare,
    showChat, setShowChat,
    showParticipants, setShowParticipants,
    isRecording, toggleRecording,
    leaveMeeting
}) {
    const baseBtnClass = "w-12 h-12 flex items-center justify-center rounded-full text-white cursor-pointer transition-all active:scale-95 duration-200 border border-transparent shadow-sm";

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-[#1e293b]/90 backdrop-blur-md px-6 py-3 rounded-full z-[100] shadow-2xl border border-white/5">
            
            {/* Microphone Control */}
            <button 
                onClick={toggleMute} 
                className={`${baseBtnClass} ${isMuted ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-[#1e293b] hover:bg-slate-700"}`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
                {isMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
            </button>

            {/* Camera Control */}
            <button 
                onClick={toggleCamera} 
                className={`${baseBtnClass} ${isCameraOff ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-[#1e293b] hover:bg-slate-700"}`}
                title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
            >
                {isCameraOff ? <FaVideoSlash size={18} /> : <FaVideo size={18} />}
            </button>

            {/* Screen Share Control */}
            <button 
                onClick={startScreenShare} 
                className={`${baseBtnClass} bg-[#1e293b] hover:bg-slate-700`}
                title="Share Screen"
            >
                <FaDesktop size={18} />
            </button>

            {/* Chat Control */}
            <button 
                onClick={() => {
                    setShowChat(p => !p);
                    setShowParticipants(false);
                }} 
                className={`${baseBtnClass} ${showChat ? "bg-blue-600 border-blue-500 shadow-md" : "bg-[#1e293b] hover:bg-slate-700"}`}
                title="Toggle Chat"
            >
                <FaComments size={18} />
            </button>

            {/* Participants Control */}
            <button 
                onClick={() => {
                    setShowParticipants(p => !p);
                    setShowChat(false);
                }} 
                className={`${baseBtnClass} ${showParticipants ? "bg-amber-500 text-[#0f172a] border-amber-400 shadow-md" : "bg-[#1e293b] hover:bg-slate-700"}`}
                title="Toggle Participants"
            >
                <FaUsers size={18} />
            </button>

            {/* Recording Control */}
            <button 
                onClick={toggleRecording} 
                className={`${baseBtnClass} ${isRecording ? "bg-red-600 animate-pulse border-red-500 shadow-lg" : "bg-[#1e293b] hover:bg-slate-700"}`} 
                title={isRecording ? "Stop Recording" : "Record Meeting"}
            >
                {isRecording ? <FaStop size={16} /> : <FaCircle size={16} className="text-red-500" />}
            </button>

            {/* Leave Meeting Control */}
            <button 
                onClick={leaveMeeting} 
                className={`${baseBtnClass} bg-red-600 hover:bg-red-500 shadow-md`} 
                title="Leave Call"
            >
                <FaPhoneSlash size={18} />
            </button>
        </div>
    );
}
