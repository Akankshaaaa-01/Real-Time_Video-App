import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';
import { Player } from '@lottiefiles/react-lottie-player';
import animationData from '../assets/Call.json';

export default function Landingpage() {
    const navigate = useNavigate();
    const { token, logout } = useAuth();
    const [meetingId, setMeetingId] = useState("");

    const handleJoin = () => {
        if (!meetingId.trim()) {
            alert("Please enter a valid Meeting ID");
            return;
        }
        if (token) {
            navigate(`/meet/${meetingId.trim()}`);
        } else {
            // Redirect to login, but store the target meeting
            navigate(`/auth?mode=login&join=${meetingId.trim()}`);
        }
    };

    const handleGetStarted = () => {
        if (token) {
            navigate("/lobby");
        } else {
            navigate("/auth?mode=register");
        }
    };

    return (
        <>
            <div className="absolute top-0 z-[-2] h-screen w-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]" />

            <div className='landingpageContainer min-h-screen text-white flex flex-col justify-between'>

                <nav className='flex justify-between items-center px-6 md:px-12 py-6 bg-transparent'>
                    <div 
                        onClick={() => navigate("/")} 
                        className='text-3xl md:text-4xl font-extrabold text-blue-400 cursor-pointer hover:opacity-85 transition-opacity'
                    >
                        Meetrix
                    </div>
                    <ul className='flex gap-4 md:gap-6 list-none items-center text-sm md:text-base'>
                        {token ? (
                            <>
                                <li 
                                    onClick={() => navigate("/lobby")} 
                                    className='cursor-pointer hover:text-blue-400 transition-colors font-medium'
                                >
                                    Dashboard
                                </li>
                                <li 
                                    onClick={logout} 
                                    className='bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl cursor-pointer shadow-md transition-all font-medium active:scale-95'
                                >
                                    Logout
                                </li>
                            </>
                        ) : (
                            <>
                                <li 
                                    onClick={() => navigate("/auth?mode=login")} 
                                    className='cursor-pointer hover:text-blue-400 transition-colors font-medium'
                                >
                                    JOIN as Guest
                                </li>
                                <li 
                                    onClick={() => navigate("/auth?mode=register")} 
                                    className='cursor-pointer hover:text-blue-400 transition-colors font-medium'
                                >
                                    Register
                                </li>
                                <li 
                                    onClick={() => navigate("/auth?mode=login")} 
                                    className='bg-blue-900 hover:bg-blue-700 px-5 py-2 rounded-xl cursor-pointer shadow-lg shadow-blue-500/25 transition-all font-semibold active:scale-95'
                                >
                                    Login
                                </li>
                            </>
                        )}
                    </ul>
                </nav>

                <div className='flex-1 flex flex-col md:flex-row justify-between px-6 md:px-12 items-center gap-10 my-12 md:my-0'>

                    {/* Left */}
                    <div className="max-w-xl">
                        <h1 className='text-4xl md:text-6xl font-extrabold leading-tight tracking-tight'>
                            <span>Connect</span> with your&nbsp; 
                            <span className='bg-gradient-to-r from-blue-300 via-purple-400 to-indigo-300 bg-clip-text text-transparent block md:inline'>
                                 Loved Ones
                            </span>
                        </h1>
                        <p className='text-blue-200/60 text-lg md:text-xl mt-4 max-w-md'>
                            Bridge the distance instantly with secure, ultra-smooth, premium video calling by Meetrix.
                        </p>
                        
                        {/* Interactive Meeting Join input right on the landing page */}
                        <div className="mt-8 flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10 hover:border-blue-500/40 focus-within:border-blue-500/80 focus-within:ring-4 focus-within:ring-blue-500/20 backdrop-blur-md max-w-md shadow-2xl transition-all duration-300">
                            <div className="pl-3 text-blue-400/70">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input 
                                type="text"
                                placeholder="Enter Meeting ID (e.g. room123)"
                                value={meetingId}
                                onChange={(e) => setMeetingId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                className="flex-grow bg-transparent border-0 outline-none py-3 text-white placeholder-gray-500 text-sm font-medium focus:ring-0 focus:outline-none"
                            />
                            <button 
                                onClick={handleJoin}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer"
                            >
                                Join
                            </button>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button 
                                onClick={handleGetStarted}
                                className='px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-[#001947] to-[#57107d] hover:from-[#57107d] hover:to-[#001947] border border-[#b8d0ff]/20 shadow-lg shadow-[#57107d]/30 transition-all text-sm active:scale-95'
                            >
                                Get Started
                            </button>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center justify-center">
                        <Player
                            autoplay
                            loop
                            src={animationData}
                            style={{ width: '100%', maxWidth: '400px', height: 'auto' }}
                        />
                    </div>

                </div>

                <footer className="text-center py-6 border-t border-white/5 text-xs text-gray-500">
                    &copy; 2026 Meetrix Inc. All rights reserved.
                </footer>

            </div>
        </>
    );
}