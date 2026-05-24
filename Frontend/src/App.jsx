import './App.css'
import { Routes, Route, BrowserRouter as Router, Navigate, useLocation } from 'react-router-dom'
import Landingpage from './pages/landing.jsx'
import Authentication from './pages/authentication.jsx'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import VideoMeet from './pages/VideoMeet.jsx'
import Lobby from "./pages/Lobby";

const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();
    const location = useLocation();

    if (!token) {
        const match = location.pathname.match(/\/meet\/([^/]+)/);
        if (match) {
            return <Navigate to={`/auth?join=${match[1]}`} replace />;
        }
        return <Navigate to="/auth" replace />;
    }

    return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landingpage />} />
          <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
          <Route path="/auth" element={<Authentication />} />
          <Route path="/meet/:id" element={<ProtectedRoute><VideoMeet /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App