import React, { useEffect, useState } from 'react'
import { animateNumber } from '../lib/animationUtils'
import { calcScore, effectLabels } from '../lib/gameLogic'

export default function GameRightStats({ mode, effects, effectCount, settings }) {
  const targetCount = effectCount ?? 0
  const targetScore = calcScore(targetCount)
  const effectText = effectLabels(effects)

  const [displayCount, setDisplayCount] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)
  const [labelReveal, setLabelReveal] = useState(false)

  useEffect(() => {
    if (mode !== 'revealing') return undefined

    const countFrom = 1
    const countTo = targetCount
    const scoreFrom = 1
    const scoreTo = targetScore
    const countMs = (settings.effectCountAnimSec ?? 1) * 1000
    const scoreMs = (settings.scoreCountAnimSec ?? 1) * 1000

    setDisplayCount(countFrom)
    setDisplayScore(scoreFrom)
    setLabelReveal(false)

    const labelTimer = window.setTimeout(() => setLabelReveal(true), 50)

    let cancelled = false
    Promise.all([
      animateNumber(countFrom, countTo, countMs, setDisplayCount),
      animateNumber(scoreFrom, scoreTo, scoreMs, setDisplayScore),
    ])

    return () => {
      cancelled = true
      window.clearTimeout(labelTimer)
    }
  }, [mode, targetCount, targetScore, settings])

  useEffect(() => {
    if (mode === 'shown') {
      setDisplayCount(targetCount)
      setDisplayScore(targetScore)
      setLabelReveal(true)
    }
    if (mode === 'hidden') {
      setDisplayCount(0)
      setDisplayScore(0)
      setLabelReveal(false)
    }
  }, [mode, targetCount, targetScore])

  const countValue = mode === 'hidden' ? '--' : displayCount
  const scoreValue = mode === 'hidden' ? '--' : displayScore.toLocaleString()
  const effectsValue = mode === 'hidden' ? '--' : effectText
  const revealSec = settings.effectLabelRevealSec ?? 0.8

  return (
    <>
      <div className="kv">
        <div className="k">効果数</div>
        <div className="v">{countValue}</div>
      </div>
      <div className="kv">
        <div className="k">効果</div>
        <div className="v">
          <span
            className={labelReveal ? 'effectRevealText revealed' : 'effectRevealText'}
            style={{ transitionDuration: `${revealSec}s` }}
          >
            {effectsValue}
          </span>
        </div>
      </div>
      <div className="kv">
        <div className="k">獲得点</div>
        <div className="scoreHighlight">{scoreValue}</div>
      </div>
    </>
  )
}
