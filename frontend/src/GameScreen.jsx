import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useGameState } from './state/GameState'
import { effectLabels, PHASE_LABELS } from './lib/gameLogic'

const PLAYER_LABELS = ['P1', 'P2', 'P3', 'P4', 'P5']

export default function GameScreen() {
  const { state, patch } = useGameState()
  const [images, setImages] = useState([])
  const [displayScale, setDisplayScale] = useState(1)
  const shrinkRef = useRef(null)
  const scaleRef = useRef(1)

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

  // 表示開始時に拡大率をリセット
  useEffect(() => {
    if (state.phase === 'display' || state.phase === 'countdown') {
      const z = state.settings?.initialZoom ?? 4
      scaleRef.current = z
      setDisplayScale(z)
    }
  }, [state.phase, state.settings?.initialZoom])

  // 縮小アニメーション（ローカル描画のみ。WS には送らない）
  useEffect(() => {
    if (state.phase !== 'shrinking') {
      if (shrinkRef.current) cancelAnimationFrame(shrinkRef.current)
      return undefined
    }

    const settings = state.settings || {}
    const minZoom = settings.minZoom ?? 1
    const speed = settings.shrinkSpeed ?? 0.12
    if (state.shrinkScale != null) {
      scaleRef.current = state.shrinkScale
      setDisplayScale(state.shrinkScale)
    }
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
  }, [state.phase, state.settings, state.shrinkScale])

  const focus = state.focusCenter || { x: 0.5, y: 0.5 }
  const scale = ['display', 'countdown', 'shrinking', 'answering'].includes(state.phase)
    ? displayScale
    : state.settings?.initialZoom ?? 1
  const phaseLabel = PHASE_LABELS[state.phase] || state.phase

  const showRoulette = state.phase === 'roulette_count' || state.phase === 'roulette_effects'
  const rouletteText = useMemo(() => {
    const d = state.rouletteDisplay
    if (!d) return '…'
    if (state.phase === 'roulette_count') {
      if (d.spinning) return '?'
      return `効果数: ${d.n}`
    }
    if (state.phase === 'roulette_effects') {
      return effectLabels(d.effects || state.effects)
    }
    return ''
  }, [state.effects, state.phase, state.rouletteDisplay])

  return (
    <div className="gameGrid">
      <section className="gameImagePanel">
        {effectiveImage && imageSrc ? (
          <div className="imageFrame">
            {showRoulette ? (
              <div className="rouletteOverlay">
                <div className="rouletteTitle">
                  {state.phase === 'roulette_count' ? '効果数ルーレット' : '効果ルーレット'}
                </div>
                <div className="rouletteValue">{rouletteText}</div>
              </div>
            ) : (
              <div
                className="zoomViewport"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
                }}
              >
                <img className="questionImage" src={imageSrc} alt="question" />
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
        <div className="kv">
          <div className="k">効果数 n</div>
          <div className="v">{state.effectCount ?? 0}</div>
        </div>
        <div className="kv">
          <div className="k">効果</div>
          <div className="v">{effectLabels(state.effects)}</div>
        </div>
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
