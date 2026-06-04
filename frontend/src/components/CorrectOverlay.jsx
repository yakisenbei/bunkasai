import React, { useEffect, useRef, useState } from 'react'
import Confetti from 'react-confetti'
import { animateNumber } from '../lib/animationUtils'
import { useWindowSize } from '../lib/resultUtils'
import { stripExtension } from '../lib/stringUtils'

export default function CorrectOverlay({
  playerLabels,
  correctReveal,
  settings,
  onScoreAnimationComplete,
}) {
  const { width, height } = useWindowSize()
  const { playerIndex, pointsAwarded, scoresBefore, imageName } = correctReveal
  const imageUrl = imageName ? `/images/${encodeURIComponent(imageName)}` : null
  const answerText = stripExtension(imageName)
  const winnerLabel = playerLabels[playerIndex] ?? `P${playerIndex + 1}`
  const delayMs = (settings.correctScoreDelaySec ?? 1) * 1000
  const animMs = (settings.correctScoreAnimSec ?? 1) * 1000
  const maxOpacity = settings.correctOverlayOpacity ?? 0.72
  const confettiPieces = settings.confettiPieces ?? 320
  const confettiGravity = settings.confettiGravity ?? 0.22

  const baseScores = scoresBefore ?? []
  const finalWinnerScore = (baseScores[playerIndex] ?? 0) + pointsAwarded

  const [displayScores, setDisplayScores] = useState(() => baseScores.map((s) => s ?? 0))
  const [displayAward, setDisplayAward] = useState(0)
  const [scoreAnimating, setScoreAnimating] = useState(false)
  const [imgError, setImgError] = useState(false)
  const onCompleteRef = useRef(onScoreAnimationComplete)
  const scoreAppliedRef = useRef(false)
  onCompleteRef.current = onScoreAnimationComplete

  // 問題が切り替わったら imgError をリセット
  useEffect(() => {
    setImgError(false)
  }, [correctReveal.id])

  useEffect(() => {
    scoreAppliedRef.current = false
    setDisplayScores(baseScores.map((s) => s ?? 0))
    setDisplayAward(0)
    setScoreAnimating(false)

    let cancelled = false
    const run = async () => {
      await new Promise((r) => setTimeout(r, delayMs))
      if (cancelled) return

      setScoreAnimating(true)
      await animateNumber(0, pointsAwarded, animMs, (value) => {
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
      <div className="correctLayout">
        {/* ヘッダー */}
        <div className="correctHeader">正解！</div>
        {/* 左カラム */}
        <div className="correctLeft">
          {imageUrl && !imgError && (
            <img
              className="correctAnswerImage"
              src={imageUrl}
              alt={answerText}
              onError={() => setImgError(true)}
            />
          )}
          {answerText && <div className="correctAnswerText">{answerText}</div>}
        </div>
        {/* 右カラム */}
        <div className="correctRight">
          <div className="correctWinnerLabel">{winnerLabel}</div>
          <div className={`correctPoints${scoreAnimating ? ' animating' : ''}`}>
            +{displayAward.toLocaleString()} 点
          </div>
        </div>
        {/* 下エリア */}
        <div className="correctScoreArea">
          {playerLabels.map((label, idx) => {
            const isWinner = idx === playerIndex
            return (
              <div key={label} className={`correctScoreRow${isWinner ? ' winner' : ''}`}>
                <span className="correctScoreName">{label}</span>
                {isWinner ? (
                  <span className="correctScoreChange">
                    {(baseScores[idx] ?? 0).toLocaleString()}
                    {' → '}
                    {(displayScores[idx] ?? 0).toLocaleString()}
                  </span>
                ) : (
                  <span className="correctScoreChange">
                    {(displayScores[idx] ?? 0).toLocaleString()}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
