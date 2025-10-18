import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import GameBoardPage from './pages/GameBoardPage'
import GameLobby from './pages/GameLobby'
import HostLobby from './pages/HostLobby'

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Navigate to="/hostlobby" replace />} />
          <Route path="/lobby" element={<GameLobby />} />
          <Route path="/hostlobby" element={<HostLobby />} />
          <Route path="/gameboard" element={<GameBoardPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
