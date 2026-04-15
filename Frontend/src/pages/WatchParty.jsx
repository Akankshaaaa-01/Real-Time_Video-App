// components/WatchParty.jsx
import { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';

export default function WatchParty({ socket, roomId }) {
    const [videoUrl, setVideoUrl] = useState('');
    const [videoId, setVideoId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [showPlayer, setShowPlayer] = useState(false);
    const playerRef = useRef(null);

    // Extract YouTube video ID from URL
    const getVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Load video
    const loadVideo = () => {
        const id = getVideoId(videoUrl);
        if (id) {
            setVideoId(id);
            setShowPlayer(true);
            
            // Broadcast to everyone
            socket.emit('watch-party-load', {
                roomId,
                videoId: id,
                currentTime: 0
            });
        } else {
            alert('Invalid YouTube URL');
        }
    };

    // When video is ready
    const onReady = (event) => {
        playerRef.current = event.target;
        
        // Sync time with others
        socket.on('sync-time', ({ time, playing }) => {
            if (playerRef.current) {
                const currentPlayerTime = playerRef.current.getCurrentTime();
                if (Math.abs(currentPlayerTime - time) > 1) {
                    playerRef.current.seekTo(time, true);
                }
                if (playing && !isPlaying) {
                    playerRef.current.playVideo();
                    setIsPlaying(true);
                } else if (!playing && isPlaying) {
                    playerRef.current.pauseVideo();
                    setIsPlaying(false);
                }
            }
        });
    };

    // Handle play/pause
    const onPlay = () => {
        setIsPlaying(true);
        socket.emit('watch-party-control', {
            roomId,
            action: 'play',
            time: playerRef.current?.getCurrentTime()
        });
    };

    const onPause = () => {
        setIsPlaying(false);
        socket.emit('watch-party-control', {
            roomId,
            action: 'pause',
            time: playerRef.current?.getCurrentTime()
        });
    };

    // Seek to specific time
    const onSeek = (time) => {
        socket.emit('watch-party-control', {
            roomId,
            action: 'seek',
            time: time
        });
    };

    // Close watch party
    const closeWatchParty = () => {
        setShowPlayer(false);
        setVideoId(null);
        setVideoUrl('');
        socket.emit('watch-party-close', { roomId });
    };

    // Listen for party close
    useEffect(() => {
        socket.on('watch-party-closed', () => {
            setShowPlayer(false);
            setVideoId(null);
            setVideoUrl('');
        });

        return () => {
            socket.off('watch-party-closed');
            socket.off('sync-time');
        };
    }, [socket]);

    const opts = {
        height: '400',
        width: '100%',
        playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0
        }
    };

    return (
        <>
            {/* Button to open watch party */}
            {!showPlayer && (
                <button
                    onClick={() => setShowPlayer(true)}
                    style={watchButtonStyle}
                    title="Watch Together"
                >
                    🎬 Watch Together
                </button>
            )}

            {/* Watch Party Modal */}
            {showPlayer && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        {/* Header */}
                        <div style={modalHeaderStyle}>
                            <h3>🎬 Watch Together</h3>
                            <button onClick={closeWatchParty} style={closeButtonStyle}>
                                ✕
                            </button>
                        </div>

                        {/* URL Input (if no video loaded) */}
                        {!videoId ? (
                            <div style={inputContainerStyle}>
                                <input
                                    type="text"
                                    placeholder="Paste YouTube URL here..."
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    style={inputStyle}
                                    onKeyPress={(e) => e.key === 'Enter' && loadVideo()}
                                />
                                <button onClick={loadVideo} style={loadButtonStyle}>
                                    Load Video
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* YouTube Player */}
                                <YouTube
                                    videoId={videoId}
                                    opts={opts}
                                    onReady={onReady}
                                    onPlay={onPlay}
                                    onPause={onPause}
                                    style={{ marginBottom: '10px' }}
                                />

                                {/* Current video info */}
                                <div style={videoInfoStyle}>
                                    <span>🎥 Watching together</span>
                                    <button onClick={closeWatchParty} style={closeVideoButtonStyle}>
                                        Stop Watching
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

// Styles
const watchButtonStyle = {
    background: "#8b5cf6",
    border: "none",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "white",
    fontSize: "20px",
    transition: "all 0.2s"
};

const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.8)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
};

const modalContentStyle = {
    background: "#1e293b",
    borderRadius: "12px",
    width: "800px",
    maxWidth: "90%",
    maxHeight: "80%",
    overflow: "auto",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
};

const modalHeaderStyle = {
    padding: "16px 20px",
    borderBottom: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
};

const closeButtonStyle = {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px 8px"
};

const inputContainerStyle = {
    padding: "40px",
    display: "flex",
    gap: "12px"
};

const inputStyle = {
    flex: 1,
    padding: "12px 16px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "white",
    fontSize: "16px",
    outline: "none"
};

const loadButtonStyle = {
    padding: "12px 24px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold"
};

const videoInfoStyle = {
    padding: "12px 20px",
    background: "#0f172a",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px"
};

const closeVideoButtonStyle = {
    padding: "6px 12px",
    background: "#ef4444",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
    fontSize: "12px"
};