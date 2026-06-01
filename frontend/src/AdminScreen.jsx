import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useGameState } from './state/GameState'
import {
  calcScore,
  defaultSettings,
  delay,
  effectLabels,
  PHASE_LABELS,
  randomFocus,
} from './lib/gameLogic'

const PLAYER_LABELS = ['P1', 'P2', 'P3', 'P4', 'P5']

export default function AdminScreen() {
  const { state, patch, adjustScore, reset } = useGameState()
  const [images, setImages] = useState([])
  const [manualDelta, setManualDelta] = useState(100)
  const [starting, setStarting] = useState(false)

  const settings = state.settings ?? defaultSettings()

  useEffect(() => {
    fetch('/api/images')
      .then((r) => r.json())
      .then((d) => setImages(d.images || []))
  }, [])

  const updateSettings = useCallback(
    (partial) => {
      const next = { ...settings, ...partial }
      patch({ settings: next })
      fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effect_count_weights: next.effectCountWeights,
          pre_shrink_countdown_sec: next.preShrinkCountdownSec,
          shrink_speed: next.shrinkSpeed,
          initial_zoom: next.initialZoom,
          min_zoom: next.minZoom,
        }),
      }).catch(() => {})
    },
    [patch, settings],
  )

  const stop = useCallback(() => {
    if (!['display', 'countdown', 'shrinking'].includes(state.phase)) return
    patch({ phase: 'answering', timeLeftSec: null })
  }, [patch, state.phase])

  const resume = useCallback(() => {
    if (state.phase !== 'answering') return
    patch({ phase: 'shrinking' })
  }, [patch, state.phase])

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space' || e.repeat) return
      e.preventDefault()
      if (['display', 'countdown', 'shrinking'].includes(state.phase)) stop()
      else if (state.phase === 'answering') resume()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [resume, state.phase, stop])

  const processCurrentImage = async (imageName, effects, focus) => {
    const res = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_name: imageName,
        effects,
        focus_x: focus.x,
        focus_y: focus.y,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '画像処理に失敗しました')
    }
    return res.json()
  }

  const startRound = async () => {
    if (starting) return
    const imageName = state.currentImage || images[0]
    if (!imageName) {
      alert('出題画像を選択するか、backend/images/ に画像を配置してください')
      return
    }

    setStarting(true)
    const nextTurn = (state.turn ?? 0) + 1

    try {
      patch({
        turn: nextTurn,
        currentImage: imageName,
        phase: 'roulette_count',
        rouletteDisplay: { spinning: true },
        processedImageUrl: null,
      })

      const drawRes = await fetch('/api/round/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights: settings.effectCountWeights }),
      })
      if (!drawRes.ok) throw new Error('抽選に失敗しました')
      const draw = await drawRes.json()
      const { effect_count: n, effects } = draw

      patch({
        phase: 'roulette_count',
        effectCount: n,
        rouletteDisplay: { n, spinning: false },
      })
      await delay(1200)

      patch({
        phase: 'roulette_effects',
        effects,
        rouletteDisplay: { n, effects },
      })
      await delay(1200)

      const focus = state.useRandomCenter ? randomFocus() : state.focusCenter || randomFocus()
      const processed = await processCurrentImage(imageName, effects, focus)

      patch({
        phase: 'display',
        effectCount: n,
        effects,
        focusCenter: focus,
        processedImageUrl: processed.processed_url,
        shrinkScale: settings.initialZoom,
        rouletteDisplay: null,
      })
      await delay(600)

      patch({
        phase: 'countdown',
        timeLeftSec: settings.preShrinkCountdownSec,
        shrinkScale: settings.initialZoom,
      })
    } catch (err) {
      alert(err.message || String(err))
      patch({ phase: 'idle', rouletteDisplay: null, timeLeftSec: null })
    } finally {
      setStarting(false)
    }
  }

  const handleCorrect = (playerIndex) => {
    const n = state.effectCount ?? state.effects?.length ?? 0
    adjustScore(playerIndex, calcScore(n))
    patch({
      phase: 'idle',
      timeLeftSec: null,
      effects: [],
      effectCount: 0,
      processedImageUrl: null,
      shrinkScale: null,
      rouletteDisplay: null,
    })
  }

  const endGame = () => patch({ phase: 'result' })

  const initialize = () => {
    if (!confirm('スコア等を初期化しますか？')) return
    reset()
  }

  const setCurrentImage = (name) => patch({ currentImage: name })

  const phaseLabel = PHASE_LABELS[state.phase] || state.phase
  const pendingScore = calcScore(state.effectCount ?? state.effects?.length ?? 0)
  const canStop = ['display', 'countdown', 'shrinking'].includes(state.phase)
  const isAnswering = state.phase === 'answering'

  const weightInputs = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="weightCell">
          <span>{n}</span>
          <input
            type="number"
            min={0}
            step={1}
            value={settings.effectCountWeights[n] ?? 1}
            onChange={(e) => {
              const weights = [...settings.effectCountWeights]
              weights[n] = Number(e.target.value)
              updateSettings({ effectCountWeights: weights })
            }}
          />
        </label>
      )),
    [settings.effectCountWeights, updateSettings],
  )

  return (
    <div className="adminGrid">
      <section className="adminPanel">
        <div className="panelTitle">進行</div>
        <div className="row">
          <button onClick={startRound} disabled={starting || state.phase !== 'idle'}>
            {starting ? '準備中…' : 'ルーレット開始'}
          </button>
          <button onClick={stop} disabled={!canStop}>
            停止（回答受付）
          </button>
          <button onClick={resume} disabled={!isAnswering}>
            再開（不正解）
          </button>
        </div>
        <div className="row">
          <button className="danger" onClick={endGame}>
            リザルト
          </button>
          <button className="danger" onClick={initialize}>
            初期化
          </button>
        </div>
        <div className="muted">スペース: 停止 / 不正解時は再開</div>

        <div className="kvList">
          <div className="kv">
            <div className="k">状態</div>
            <div className="v">{phaseLabel}</div>
          </div>
          <div className="kv">
            <div className="k">ターン</div>
            <div className="v">{state.turn}</div>
          </div>
          <div className="kv">
            <div className="k">カウント</div>
            <div className="v">{state.timeLeftSec ?? '--'} sec</div>
          </div>
          <div className="kv">
            <div className="k">効果数 n</div>
            <div className="v">{state.effectCount ?? 0}</div>
          </div>
          <div className="kv">
            <div className="k">効果</div>
            <div className="v">{effectLabels(state.effects)}</div>
          </div>
          <div className="kv">
            <div className="k">正解時加点</div>
            <div className="v">{pendingScore} 点</div>
          </div>
        </div>
      </section>

      {isAnswering && (
        <section className="adminPanel answerPanel">
          <div className="panelTitle">正解判定</div>
          <p className="answerHint">正解したプレイヤーを選んでください（+{pendingScore} 点）</p>
          <div className="answerButtons">
            {PLAYER_LABELS.map((label, idx) => (
              <button key={label} className="answerBtn" onClick={() => handleCorrect(idx)}>
                {label} 正解
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="adminPanel">
        <div className="panelTitle">パラメータ</div>
        <div className="paramRow">
          <label>
            縮小前カウント（秒）
            <input
              type="number"
              min={0}
              step={0.5}
              value={settings.preShrinkCountdownSec}
              onChange={(e) => updateSettings({ preShrinkCountdownSec: Number(e.target.value) })}
            />
          </label>
          <label>
            縮小速度
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={settings.shrinkSpeed}
              onChange={(e) => updateSettings({ shrinkSpeed: Number(e.target.value) })}
            />
          </label>
          <label>
            初期拡大倍率
            <input
              type="number"
              min={1}
              step={0.1}
              value={settings.initialZoom}
              onChange={(e) => updateSettings({ initialZoom: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="panelTitle sub">効果個数の重み（0〜5）</div>
        <div className="weightGrid">{weightInputs}</div>
        <label className="checkRow">
          <input
            type="checkbox"
            checked={state.useRandomCenter}
            onChange={(e) => patch({ useRandomCenter: e.target.checked })}
          />
          拡大中心をランダムにする
        </label>
      </section>

      <section className="adminPanel">
        <div className="panelTitle">出題画像</div>
        {images.length === 0 ? (
          <div className="emptyHint">backend/images/ に画像を配置してください</div>
        ) : (
          <div className="imageList">
            {images.map((name) => (
              <button
                key={name}
                className={name === state.currentImage ? 'chip active' : 'chip'}
                onClick={() => setCurrentImage(name)}
                disabled={state.phase !== 'idle' && state.phase !== 'result'}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="adminPanel">
        <div className="panelTitle">得点（手動調整）</div>
        <div className="row">
          <label>
            増減量
            <input
              type="number"
              value={manualDelta}
              onChange={(e) => setManualDelta(Number(e.target.value))}
              style={{ marginLeft: 8, width: 100 }}
            />
          </label>
        </div>
        <div className="scoreOps">
          {state.scores.map((score, idx) => (
            <div key={idx} className="scoreRow">
              <div className="scoreName">{PLAYER_LABELS[idx]}</div>
              <div className="scoreValue">{score}</div>
              <div className="row">
                <button onClick={() => adjustScore(idx, manualDelta)}>+{manualDelta}</button>
                <button onClick={() => adjustScore(idx, -manualDelta)}>-{manualDelta}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
