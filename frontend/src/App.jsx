import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import GameScreen from './GameScreen'
import AdminScreen from './AdminScreen'

export default function App() {
  return (
    <div className="appRoot">
      <main className="appMain">
        <Routes>
          <Route path="/" element={<Navigate to="/game" replace />} />
          <Route path="/game" element={<GameScreen />} />
          <Route path="/admin" element={<AdminScreen />} />
          <Route path="*" element={<Navigate to="/game" replace />} />
        </Routes>
      </main>
    </div>
  )
}
