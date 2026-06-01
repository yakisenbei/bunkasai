import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { GameStateProvider } from './state/GameState'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameStateProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GameStateProvider>
  </React.StrictMode>
)
