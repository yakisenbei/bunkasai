import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGameState } from './state/GameState'
import GameRightStats from './components/GameRightStats'
import QuestionImage from './components/QuestionImage'
import CorrectOverlay from './components/CorrectOverlay'
import ResultOverlay from './components/ResultOverlay'
import RouletteOverlay from './components/RouletteOverlay'
import StageDimBackdrop from './components/StageDimBackdrop'
import { waitMs } from './lib/animationUtils'
import useSound from 'use-sound';
import Sound from '../sounds/電子ルーレット.mp3';

const PLAYER_LABELS = ['P1', 'P2', 'P3', 'P4', 'P5']

export default function GameScreen() {
  const { state, patch, adjustScore } = useGameState()
  const [images, setImages] = useState([])
  const [displayScale, setDisplayScale] = useState(1)
  const [rouletteDim, setRouletteDim] = useState(0)
  const [UseSound] = useSound(Sound);
  const [statsMode, setStatsMode] = useState('hidden')
  const [gameImageVisible, setGameImageVisible] = useState(false)
  const shrinkRef = useRef(null)
  const scaleRef = useRef(1)
  const prevPhaseRef = useRef(state.phase)
  const revealedTurnRef = useRef(-1)
  const correctRevealRef = useRef(state.correctReveal)
  const appliedRevealIdsRef = useRef(new Set())

  useEffect(() => {
    correctRevealRef.current = state.correctReveal
  }, [state.correctReveal])

  const handleCorrectScoreApplied = useCallback(() => {
    const r = correctRevealRef.current
    if (!r || appliedRevealIdsRef.current.has(r.id)) return
    appliedRevealIdsRef.current.add(r.id)
    adjustScore(r.playerIndex, r.pointsAwarded / 2)//直す
  }, [adjustScore])

  const settings = state.settings || {}
  const isRoulettePhase =
    state.phase === 'roulette_count' || state.phase === 'roulette_effects'
  const showRouletteContent = isRoulettePhase

  useEffect(() => {
    fetch('/api/images')
      .then((r) => r.json())
      .then((d) => setImages(d.images || []))
  }, [])

  const effectiveImage = useMemo(
    () => state.currentImage || images[0] || null,
    [images, state.currentImage],
  )

  const imageSrc = useMemo(() => {
    if (state.processedImageUrl) return state.processedImageUrl
    if (effectiveImage) return `/images/${encodeURIComponent(effectiveImage)}`
    return null
  }, [effectiveImage, state.processedImageUrl])

  useEffect(() => {
    if (state.currentImage === null && images.length > 0) {
      patch({ currentImage: images[0] })
    }
  }, [images, patch, state.currentImage])

  // ルーレット暗転: フェードイン / フェードアウト
  useEffect(() => {
    const fadeInMs = (settings.overlayFadeInSec ?? 0.6) * 1000
    const fadeOutMs = (settings.overlayFadeOutSec ?? 0.6) * 1000
    const prev = prevPhaseRef.current
    prevPhaseRef.current = state.phase

    if (isRoulettePhase) {
      setGameImageVisible(false)
      setRouletteDim(0);
      UseSound(Sound);
      const t = window.setTimeout(() => setRouletteDim(1), 30)
      return () => window.clearTimeout(t)
    }

    const wasRoulette =
      prev === 'roulette_count' || prev === 'roulette_effects'
    if (wasRoulette && !isRoulettePhase) {
      setRouletteDim(0)
      const t = window.setTimeout(() => {}, fadeOutMs)
      return () => window.clearTimeout(t)
    }

    if (!isRoulettePhase && state.phase !== 'display') {
      setRouletteDim(0)
    }
    return undefined
  }, [isRoulettePhase, state.phase, settings.overlayFadeInSec, settings.overlayFadeOutSec])

  // ルーレット終了後: 右カラム演出 → カウントダウン開始
  useEffect(() => {
    if (state.phase !== 'display') {
      if (state.phase === 'idle' || state.phase === 'correct' || state.phase === 'result') {
        setStatsMode('hidden')
        setGameImageVisible(false)
        if (state.phase !== 'display') revealedTurnRef.current = -1
      }
      return undefined
    }

    if (revealedTurnRef.current === state.turn) return undefined

    let cancelled = false
    const run = async () => {
      const fadeOutMs = (settings.overlayFadeOutSec ?? 0.6) * 1000
      const delayMs = (settings.statsRevealDelaySec ?? 0.2) * 1000
      const countMs = (settings.effectCountAnimSec ?? 1) * 1000
      const scoreMs = (settings.scoreCountAnimSec ?? 1) * 1000
      const labelMs = (settings.effectLabelRevealSec ?? 0.8) * 1000
      const revealMs = Math.max(countMs, scoreMs, labelMs) + delayMs

      await waitMs(fadeOutMs)
      if (cancelled) return
      setGameImageVisible(true)
      await waitMs(delayMs)
      if (cancelled) return

      setStatsMode('revealing')
      await waitMs(revealMs)
      if (cancelled) return

      setStatsMode('shown')
      revealedTurnRef.current = state.turn
      patch({
        phase: 'countdown',
        timeLeftSec: settings.preShrinkCountdownSec ?? 3,
        shrinkScale: settings.initialZoom ?? 4,
      })
    }

    run()
    return () => {
      cancelled = true
    }
  }, [
    patch,
    state.phase,
    state.turn,
    settings.overlayFadeOutSec,
    settings.statsRevealDelaySec,
    settings.effectCountAnimSec,
    settings.scoreCountAnimSec,
    settings.effectLabelRevealSec,
    settings.preShrinkCountdownSec,
    settings.initialZoom,
  ])

  // 縮小前カウントダウン
  useEffect(() => {
    if (state.phase !== 'countdown' || state.timeLeftSec == null) return undefined
    if (state.timeLeftSec <= 0) {
      patch({ phase: 'shrinking', timeLeftSec: null })
      return undefined
    }
    const id = setTimeout(() => {
      patch({ timeLeftSec: state.timeLeftSec - 1 })
    }, 1000)
    return () => clearTimeout(id)
  }, [patch, state.phase, state.timeLeftSec])

  useEffect(() => {
    if (state.phase === 'display' || state.phase === 'countdown') {
      const z = settings.initialZoom ?? 4
      scaleRef.current = z
      setDisplayScale(z)
    }
  }, [state.phase, settings.initialZoom])

  useEffect(() => {
    if (state.phase !== 'shrinking') {
      if (shrinkRef.current) cancelAnimationFrame(shrinkRef.current)
      return undefined
    }

    const minZoom = settings.minZoom ?? 1
    const speed = settings.shrinkSpeed ?? 0.12
    let last = performance.now()

    const tick = (now) => {
      const dt = (now - last) / 1000
      last = now
      scaleRef.current = Math.max(minZoom, scaleRef.current - speed * dt * scaleRef.current)
      setDisplayScale(scaleRef.current)
      shrinkRef.current = requestAnimationFrame(tick)
    }

    shrinkRef.current = requestAnimationFrame(tick)
    return () => {
      if (shrinkRef.current) cancelAnimationFrame(shrinkRef.current)
    }
  }, [state.phase, settings.shrinkSpeed, settings.minZoom])

  const focus = state.focusCenter || { x: 0.5, y: 0.5 }
  const scale = ['display', 'countdown', 'shrinking', 'answering'].includes(state.phase)
    ? displayScale
    : settings.initialZoom ?? 1
  const hasBlackReveal = state.effects?.includes('black_reveal') ?? false
  const initialZoom = settings.initialZoom ?? 4
  const minZoom = settings.minZoom ?? 1

  const showQuestionImage =
    gameImageVisible &&
    !showRouletteContent &&
    ['display', 'countdown', 'shrinking', 'answering'].includes(state.phase)

  const statsModeResolved = ['countdown', 'shrinking', 'answering'].includes(state.phase)
    ? 'shown'
    : statsMode

  const dimTransitionSec = isRoulettePhase
    ? settings.overlayFadeInSec ?? 0.6
    : settings.overlayFadeOutSec ?? 0.6

  return (
    <div className="gameGrid">
      <StageDimBackdrop
        opacity={rouletteDim}
        zIndex={940}
        transitionSec={dimTransitionSec}
      />

      {state.phase === 'result' && (
        <ResultOverlay
          scores={state.scores}
          playerLabels={PLAYER_LABELS}
          fadeInSec={settings.resultOverlayFadeInSec ?? 0.6}
          confettiPieces={settings.confettiPieces ?? 320}
          confettiGravity={settings.confettiGravity ?? 0.22}
        />
      )}

      {state.phase === 'correct' && state.correctReveal && (
        <CorrectOverlay
          key={state.correctReveal.id}
          playerLabels={PLAYER_LABELS}
          correctReveal={state.correctReveal}
          settings={settings}
          onScoreAnimationComplete={handleCorrectScoreApplied}
        />
      )}

      {showRouletteContent && (
        <RouletteOverlay
          phase={state.phase}
          rouletteDisplay={state.rouletteDisplay}
          maxEffectCount={settings.maxEffectCount ?? 5}
          enabledEffects={settings.enabledEffects}
          spinningSec={settings.rouletteSpinningSec ?? 4}
        />
      )}

      <section className="gameImagePanel">
        {effectiveImage && imageSrc ? (
          <div className="imageFrame">
            {showQuestionImage && (
              <div
                className="zoomViewport gameImageReveal"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
                  animationDuration: `${settings.gameImageFadeSec ?? 0.5}s`,
                }}
              >
                <QuestionImage
                  src={imageSrc}
                  hasBlackReveal={hasBlackReveal}
                  scale={scale}
                  initialZoom={initialZoom}
                  minZoom={minZoom}
                  turn={state.turn}
                  imageName={effectiveImage}
                  effects={state.effects}
                />
              </div>
            )}
            {state.phase === 'countdown' && (
              <div className="countdownOverlay">{state.timeLeftSec}</div>
            )}
            {state.phase === 'answering' && <div className="pausedBadge">停止中・回答受付</div>}
          </div>
        ) : (
          <div className="emptyHint">backend/images/ に画像を配置してください</div>
        )}
      </section>

      <aside className="gameRightPanel">
        <div className="kv">
          <div className="k">カウント</div>
          <div className="v">
            {state.phase === 'countdown' ? `${state.timeLeftSec} sec` : '--'}
          </div>
        </div>
        <div className="kv">
          <div className="k">ターン</div>
          <div className="v">{state.turn}</div>
        </div>
        <GameRightStats
          mode={statsModeResolved}
          effects={state.effects}
          effectCount={state.effectCount}
          settings={settings}
        />
      </aside>

      <footer className="gameScoreBar">
        {PLAYER_LABELS.map((label, idx) => (
          <div key={label} className="scoreCard">
            <div className="scoreName">{label}</div>
            <div className="scoreValue">{state.scores[idx] ?? 0}</div>
          </div>
        ))}
      </footer>
    </div>
  )
}
