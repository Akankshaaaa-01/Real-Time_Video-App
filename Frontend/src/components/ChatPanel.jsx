import { useState } from "react";

export default function ChatPanel({ messages, remoteUserName, onSendMessage, onClose }) {
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;
        onSendMessage(input);
        setInput("");
    };

    return (
        <div className="fixed right-0 top-0 w-80 h-full bg-[#0f172a] border-l border-[#1e293b] flex flex-col z-[1000] shadow-2xl">
            <div className="p-4 border-b border-[#1e293b] font-bold text-lg bg-[#0f172a] flex justify-between items-center text-white">
                <span>Chat</span>
                <button 
                    onClick={onClose} 
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Close Chat"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-12 text-sm">
                        No messages yet
                    </div>
                )}
                {messages.map((m, i) => (
                    <div 
                        key={i} 
                        className={`p-3 rounded-xl max-w-[80%] word-break ${
                            m.sender === "me" 
                                ? "bg-blue-600 ml-auto text-right" 
                                : "bg-[#1e293b] mr-auto text-left"
                        }`}
                    >
                        <div className="text-xs text-gray-400 opacity-80 mb-1 font-semibold">
                            {m.username || (m.sender === "me" ? "You" : remoteUserName)}
                        </div>
                        <div className="text-sm text-white">{m.text}</div>
                    </div>
                ))}
            </div>
            
            <div className="p-4 border-t border-[#1e293b] flex gap-2 bg-[#0f172a]">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 rounded-lg border border-[#1e293b] bg-[#1e293b] text-white outline-none focus:border-blue-500 transition-all text-sm placeholder-gray-500"
                />
                <button 
                    onClick={handleSend} 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
