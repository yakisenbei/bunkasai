import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { defaultSettings } from '../lib/gameLogic'

const GameStateContext = createContext(null)

const initialState = {
  turn: 0,
  phase: 'idle',
  timeLeftSec: null,
  effectCount: 0,
  effects: [],
  scores: [0, 0, 0, 0, 0],
  currentImage: null,
  processedImageUrl: null,
  focusCenter: null,
  useRandomCenter: true,
  shrinkScale: null,
  settings: defaultSettings(),
  rouletteDisplay: null,
  correctReveal: null,
}

function applyPatch(state, patch) {
  return { ...state, ...patch }
}

function reducer(state, action) {
  switch (action.type) {
    case 'PATCH':
      return applyPatch(state, action.patch)
    case 'SET_ALL':
      return { ...state, ...action.state }
    case 'ADJUST_SCORE': {
      const { playerIndex, delta } = action
      const scores = state.scores.slice()
      scores[playerIndex] = (scores[playerIndex] ?? 0) + delta
      return { ...state, scores }
    }
    case 'RESET':
      return { ...initialState, settings: state.settings }
    default:
      return state
  }
}

function getWsUrl() {
  const host = window.location.hostname
  return `ws://${host}:8000/ws`
}

export function GameStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const wsRef = useRef(null)
  const stateRef = useRef(state)
  const clientId = useMemo(() => `${Date.now()}-${Math.random().toString(16).slice(2)}`, [])

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((cfg) => {
        dispatch({ type: 'PATCH', patch: { settings: defaultSettings(cfg) } })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'HELLO', clientId }))
      ws.send(JSON.stringify({ type: 'REQUEST_STATE', clientId }))
    }

    ws.onmessage = (e) => {
      let msg
      try {
        msg = JSON.parse(e.data)
      } catch {
        return
      }

      if (msg.clientId && msg.clientId === clientId) return

      if (msg.type === 'STATE') {
        dispatch({ type: 'SET_ALL', state: msg.state })
      }
      if (msg.type === 'PATCH') {
        dispatch({ type: 'PATCH', patch: msg.patch })
      }
      if (msg.type === 'ADJUST_SCORE') {
        dispatch({ type: 'ADJUST_SCORE', playerIndex: msg.playerIndex, delta: msg.delta })
      }
      if (msg.type === 'RESET') {
        dispatch({ type: 'RESET' })
      }
      if (msg.type === 'REQUEST_STATE') {
        ws.send(JSON.stringify({ type: 'STATE', clientId, state: stateRef.current }))
      }
    }

    return () => {
      ws.close()
    }
  }, [clientId])

  const api = useMemo(() => {
    const send = (payload) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      ws.send(JSON.stringify({ ...payload, clientId }))
    }

    return {
      state,
      patch: (patch) => {
        dispatch({ type: 'PATCH', patch })
        send({ type: 'PATCH', patch })
      },
      adjustScore: (playerIndex, delta) => {
        dispatch({ type: 'ADJUST_SCORE', playerIndex, delta })
        send({ type: 'ADJUST_SCORE', playerIndex, delta })
      },
      reset: () => {
        dispatch({ type: 'RESET' })
        send({ type: 'RESET' })
      },
      broadcastState: () => {
        send({ type: 'STATE', state })
      },
    }
  }, [clientId, state])

  return <GameStateContext.Provider value={api}>{children}</GameStateContext.Provider>
}

export function useGameState() {
  const ctx = useContext(GameStateContext)
  if (!ctx) throw new Error('useGameState must be used within GameStateProvider')
  return ctx
}
