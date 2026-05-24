export default function ParticipantPanel({ participants, currentSocketId, onMuteUser, onKickUser, onClose }) {
    const currentUser = participants.find(p => p.id === currentSocketId);
    const isCurrentUserHost = currentUser?.isHost || false;

    return (
        <div className="fixed right-0 top-0 w-80 h-full bg-[#0f172a] border-l border-[#1e293b] flex flex-col z-[1000] shadow-2xl">
            <div className="p-4 border-b border-[#1e293b] font-bold text-lg bg-[#0f172a] flex justify-between items-center text-white">
                <span>Participants ({participants.length})</span>
                <button 
                    onClick={onClose} 
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Close Panel"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {participants.map((p, i) => {
                    const isSelf = p.id === currentSocketId;
                    return (
                        <div key={i} className="flex flex-col gap-2 p-3 bg-[#1e293b] rounded-xl border border-white/5 shadow-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-100">
                                    {isSelf ? "You" : (p.username || `User (${p.id.substring(0, 5)})`)}
                                </span>
                                {p.isHost && (
                                    <span className="bg-amber-500 text-[#0f172a] text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                                        Host
                                    </span>
                                )}
                            </div>
                            
                            {/* Moderation controls */}
                            {isCurrentUserHost && !isSelf && (
                                <div className="flex gap-2 mt-1">
                                    <button 
                                        onClick={() => onMuteUser(p.id)} 
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer"
                                        title="Mute microphone"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                        Mute
                                    </button>
                                    <button 
                                        onClick={() => onKickUser(p.id)} 
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer"
                                        title="Kick from meeting"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                                        </svg>
                                        Kick
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
