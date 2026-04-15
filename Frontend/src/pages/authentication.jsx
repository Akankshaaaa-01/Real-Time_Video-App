import { useState } from 'react';
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

    const { login, register } = useAuth();
    const navigate = useNavigate();
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
                    navigate("/lobby");
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
        }
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
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                    />
                )}

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                />

                {/* Messages */}
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {message && <p className="text-green-400 text-sm">{message}</p>}

                <button
                    onClick={handleSubmit}
                    className="bg-blue-900 hover:bg-blue-700 py-3 rounded-xl font-semibold"
                >
                    {formState === 0 ? 'Login' : 'Create Account'}
                </button>

            </div>
        </div>
    );
}