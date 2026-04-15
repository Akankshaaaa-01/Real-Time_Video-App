import './App.css'
import { Routes, Route, BrowserRouter as Router } from 'react-router-dom'
import Landingpage from './pages/landing.jsx'
import Authentication from './pages/authentication.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import VideoMeet from './pages/VideoMeet.jsx'
import Lobby from "./pages/Lobby";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landingpage />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/auth" element={<Authentication />} />
          <Route path="/meet/:id" element={<VideoMeet />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App