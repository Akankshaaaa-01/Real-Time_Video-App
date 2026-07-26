import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from "react-router-dom";
export default function Authentication() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [formState, setFormState] = useState(1); // 1 = signup, 0 = signin
    const [open, setOpen] = useState(true);
    const [loading, setLoading] = useState(false);

    const { login, register, token } = useAuth();
    const navigate = useNavigate();

    // Check query parameters for form mode and redirect if already logged in
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const mode = queryParams.get("mode");
        if (mode === "login") {
            setFormState(0);
        } else if (mode === "register") {
            setFormState(1);
        }

        if (token) {
            const joinId = queryParams.get("join");
            if (joinId) {
                navigate(`/meet/${joinId}`);
            } else {
                navigate("/lobby");
            }
        }
    }, [token, navigate]);

    const handleSubmit = async () => {
        setError('');
        setMessage('');

        // validation
        if (!username || !password) {
            setError('Please fill all fields');
            return;
        }

        if (formState === 1 && !name) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);
        try {
            let res;

            if (formState === 0) {
                // 🔐 LOGIN
                res = await login(username, password);

                if (!res.success) {
                    setError(res.message);
                } else {
                    setMessage('Logged in successfully!');
                    setOpen(false); // close modal
                    const queryParams = new URLSearchParams(window.location.search);
                    const joinId = queryParams.get("join");
                    if (joinId) {
                        navigate(`/meet/${joinId}`);
                    } else {
                        navigate("/lobby");
                    }
                }

            } else {
                // 🆕 REGISTER
                res = await register(name, username, password);

                if (!res.success) {
                    setError(res.message);
                } else {
                    setMessage('Account created successfully!');
                    setFormState(0); // switch to login
                }
            }

        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit();
    };

    const handleToggle = (state) => {
        setFormState(state);
        setError('');
        setMessage('');
        setUsername('');
        setPassword('');
        setName('');
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
            
            <div className="absolute top-0 z-[-2] h-screen w-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]" />

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-96 flex flex-col gap-5 text-white">

                <h2 className="text-2xl font-bold text-center text-blue-300">Meetrix</h2>

                {/* Toggle */}
                <div className='flex bg-white/5 border border-white/10 rounded-xl p-1'>
                    <button onClick={() => handleToggle(1)}
                        className={`flex-1 py-2 rounded-lg ${formState === 1 ? 'bg-blue-900 text-white' : 'text-gray-500'}`}>
                        Sign Up
                    </button>
                    <button onClick={() => handleToggle(0)}
                        className={`flex-1 py-2 rounded-lg ${formState === 0 ? 'bg-blue-900 text-white' : 'text-gray-500'}`}>
                        Sign In
                    </button>
                </div>

                {/* Name */}
                {formState === 1 && (
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 disabled:opacity-50"
                    />
                )}

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 disabled:opacity-50"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 disabled:opacity-50"
                />

                {/* Messages */}
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {message && <p className="text-green-400 text-sm">{message}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-blue-900 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                >
                    {loading && (
                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                    )}
                    {loading ? 'Please wait...' : (formState === 0 ? 'Login' : 'Create Account')}
                </button>

            </div>
        </div>
    );
}