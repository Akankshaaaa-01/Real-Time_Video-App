import axios from "axios";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

// create context
export const AuthContext = createContext(null);

// axios instance
const client = axios.create({
    baseURL: "http://localhost:8000/api/v1/users"
});


const getUsernameFromToken = (tok) => {
    try {
        if (!tok) return null;
        const payload = JSON.parse(atob(tok.split('.')[1]));
        return payload.username;
    } catch (e) {
        return null;
    }
};

export const AuthProvider = ({ children }) => {

    // ✅ state
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [username, setUsername] = useState(() => {
        return localStorage.getItem("username") || getUsernameFromToken(localStorage.getItem("token"));
    });
    const [name, setName] = useState(localStorage.getItem("name") || null);

    // ✅ login function
    const login = async (usernameVal, password) => {
        try {
            const response = await client.post("/login", { username: usernameVal, password });

            const { token, username, name } = response.data;

            // store in localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("username", username || "");
            localStorage.setItem("name", name || "");

            // update state
            setToken(token);
            setUsername(username || "");
            setName(name || "");
            return { success: true };

        } catch (err) {
            console.error("Login Failed:", err.message);

            return {
                success: false,
                message: err.response?.data?.message || "Login failed"
            }; 
        }
    };


     const register = async (nameVal, usernameVal, password) => {
        try {
            const response = await client.post("/register", {
                name: nameVal,
                username: usernameVal,
                password
            });


            return { success: true,
                message: response.data.message
             };

        } catch (err) {
            console.error("Register Failed:", err.message);

            return {
                success: false,
                message: err.response?.data?.message || "Registration failed"
            };
        }
    };

    // ✅ logout
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("name");
        setToken(null);
        setUsername(null);
        setName(null);
    };

    return (
        <AuthContext.Provider value={{ token, username, name, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

// custom hook
export const useAuth = () => useContext(AuthContext);