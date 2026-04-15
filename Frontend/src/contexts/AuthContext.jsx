import axios from "axios";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

// create context
export const AuthContext = createContext(null);

// axios instance
const client = axios.create({
    baseURL: "http://localhost:8000/api/v1/users"
});


export const AuthProvider = ({ children }) => {

    // ✅ state
    const [token, setToken] = useState(localStorage.getItem("token") || null);

    // ✅ login function
    const login = async (username, password) => {
        try {
            const response = await client.post("/login", { username, password });

            const { token } = response.data;

            // store in localStorage
            localStorage.setItem("token", token);

            // update state
            setToken(token);
            return { success: true };

        } catch (err) {
            console.error("Login Failed:", err.message);

            return {
            success: false,
            message: err.response?.data?.message || "Login failed"
        }; 
        }
    };


     const register = async (name, username, password) => {
        try {
            const response = await client.post("/register", {
                name,
                username,
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
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout,register }}>
            {children}
        </AuthContext.Provider>
    );
};

// custom hook
export const useAuth = () => useContext(AuthContext);