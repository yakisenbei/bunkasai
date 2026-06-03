import React, { useEffect, useRef, useState } from 'react'
import Confetti from 'react-confetti'
import { animateNumber } from '../lib/animationUtils'
import { useWindowSize } from '../lib/resultUtils'

export default function CorrectOverlay({
  playerLabels,
  correctReveal,
  settings,
  onScoreAnimationComplete,
}) {
  const { width, height } = useWindowSize()
  const { playerIndex, pointsAwarded, scoresBefore } = correctReveal
  const winnerLabel = playerLabels[playerIndex] ?? `P${playerIndex + 1}`
  const delayMs = (settings.correctScoreDelaySec ?? 1) * 1000
  const animMs = (settings.correctScoreAnimSec ?? 1) * 1000
  const maxOpacity = settings.correctOverlayOpacity ?? 0.72
  const confettiPieces = settings.confettiPieces ?? 320
  const confettiGravity = settings.confettiGravity ?? 0.22

  const baseScores = scoresBefore ?? []
  const finalWinnerScore = (baseScores[playerIndex] ?? 0) + pointsAwarded

  const [displayScores, setDisplayScores] = useState(() => baseScores.map((s) => s ?? 0))
  const [displayAward, setDisplayAward] = useState(pointsAwarded)
  const [scoreAnimating, setScoreAnimating] = useState(false)
  const onCompleteRef = useRef(onScoreAnimationComplete)
  const scoreAppliedRef = useRef(false)
  onCompleteRef.current = onScoreAnimationComplete

  useEffect(() => {
    scoreAppliedRef.current = false
    setDisplayScores(baseScores.map((s) => s ?? 0))
    setDisplayAward(pointsAwarded)
    setScoreAnimating(false)

    let cancelled = false
    const run = async () => {
      await new Promise((r) => setTimeout(r, delayMs))
      if (cancelled) return

      setScoreAnimating(true)
      setDisplayAward(1)
      await animateNumber(1, pointsAwarded, animMs, (value) => {
        if (!cancelled) setDisplayAward(value)
      })
      if (cancelled) return

      setDisplayScores((prev) => {
        const next = [...prev]
        next[playerIndex] = finalWinnerScore
        return next
      })
      if (!cancelled && !scoreAppliedRef.current) {
        scoreAppliedRef.current = true
        onCompleteRef.current?.()
      }
    }
    run()

    return () => {
      cancelled = true
    }
  }, [
    correctReveal.id,
    delayMs,
    animMs,
    playerIndex,
    pointsAwarded,
    finalWinnerScore,
  ])

  return (
    <div className="correctOverlay" role="dialog" aria-label="正解">
      <Confetti
        width={width}
        height={height}
        recycle
        numberOfPieces={confettiPieces}
        gravity={confettiGravity}
      />
      <div className="correctBackdrop" style={{ opacity: maxOpacity }} />
      <div className="correctCard">
        <div className="correctTitle">正解！</div>
        <div className="correctWinner">{winnerLabel}</div>
        <div className={`correctPoints${scoreAnimating ? ' animating' : ''}`}>
          +{displayAward.toLocaleString()} 点
        </div>
        <ul className="correctScoreList">
          {playerLabels.map((label, idx) => {
            const isWinner = idx === playerIndex
            const score = displayScores[idx] ?? 0
            return (
              <li
                key={label}
                className={isWinner ? 'correctScoreItem winner' : 'correctScoreItem'}
              >
                <span className="correctScoreName">{label}</span>
                <span className="correctScoreValue">{score.toLocaleString()}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
