import React, { useEffect, useRef, useState } from 'react'
import Confetti from 'react-confetti'
import { animateNumber } from '../lib/animationUtils'
import { useWindowSize } from '../lib/resultUtils'
import { stripExtension } from '../lib/stringUtils'

// black_reveal 以外の実効果があるか判定
function hasVisualEffects(effects) {
  return (effects ?? []).some((e) => e !== 'black_reveal')
}

// イーズ関数（t: 0→1 の線形入力 → 加速度付き出力）
function applyEasing(t, easing) {
  switch (easing) {
    case 'easeIn':  return t * t * t
    case 'easeOut': return 1 - (1 - t) ** 3
    case 'easeInOut':
      return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
    default: return t
  }
}

export default function CorrectOverlay({
  playerLabels,
  correctReveal,
  settings,
  onScoreAnimationComplete,
}) {
  const { width, height } = useWindowSize()
  const { playerIndex, pointsAwarded, scoresBefore, imageName, processedImageUrl, effects } = correctReveal
  const isNoContest = playerIndex === -1
  const imageUrl = imageName ? `/images/${encodeURIComponent(imageName)}` : null
  const answerText = stripExtension(imageName)
  const winnerLabel = isNoContest ? '該当者なし' : (playerLabels[playerIndex] ?? `P${playerIndex + 1}`)
  const delayMs = (settings.correctScoreDelaySec ?? 1) * 1000
  const animMs = (settings.correctScoreAnimSec ?? 1) * 1000
  const maxOpacity = settings.correctOverlayOpacity ?? 0.72
  const confettiPieces = settings.confettiPieces ?? 320
  const confettiGravity = settings.confettiGravity ?? 0.22

  // 効果済み画像→元画像への reveal アニメーション
  const revealDurationMs = (settings.correctRevealDurationSec ?? 1.8) * 1000
  const revealEasing = settings.correctRevealEasing ?? 'easeOut'
  const revealDelayMs = (settings.correctRevealDelaySec ?? 0.4) * 1000
  const showReveal = hasVisualEffects(effects) && processedImageUrl && imageUrl

  const baseScores = scoresBefore ?? []
  const finalWinnerScore = isNoContest ? 0 : (baseScores[playerIndex] ?? 0) + pointsAwarded

  const [displayScores, setDisplayScores] = useState(() => baseScores.map((s) => s ?? 0))
  const [displayAward, setDisplayAward] = useState(0)
  const [scoreAnimating, setScoreAnimating] = useState(false)
  const [imgError, setImgError] = useState(false)
  // revealProgress: 0=効果画像のみ表示、1=元画像が完全に表示
  const [revealProgress, setRevealProgress] = useState(0)
  const onCompleteRef = useRef(onScoreAnimationComplete)
  const scoreAppliedRef = useRef(false)
  onCompleteRef.current = onScoreAnimationComplete

  // 問題が切り替わったら imgError・revealProgress をリセット
  useEffect(() => {
    setImgError(false)
    setRevealProgress(0)
  }, [correctReveal.id])

  // reveal アニメーション（効果がある場合のみ）
  useEffect(() => {
    if (!showReveal) return
    let cancelled = false
    const run = async () => {
      await new Promise((r) => setTimeout(r, revealDelayMs))
      if (cancelled) return
      const start = performance.now()
      const tick = (now) => {
        if (cancelled) return
        const t = Math.min(1, (now - start) / revealDurationMs)
        setRevealProgress(applyEasing(t, revealEasing))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    run()
    return () => { cancelled = true }
  }, [correctReveal.id, showReveal, revealDelayMs, revealDurationMs, revealEasing])

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
        if (isNoContest) return prev
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
        numberOfPieces={isNoContest ? 0 : confettiPieces}
        gravity={confettiGravity}
      />
      <div className="correctBackdrop" style={{ opacity: maxOpacity }} />
      <div className="correctLayout">
        {/* ヘッダー */}
        <div className="correctHeader">{isNoContest ? '該当者なし' : '正解！'}</div>
        {/* 左カラム */}
        <div className="correctLeft">
          {imageUrl && !imgError && (
            <div className="correctImageRevealWrap">
              {/* 効果済み画像（ベース） */}
              {showReveal && (
                <img
                  className="correctAnswerImage correctAnswerImageProcessed"
                  src={processedImageUrl}
                  alt=""
                  onError={() => setImgError(true)}
                />
              )}
              {/* 元画像（左から右へ clip-path で reveal） */}
              <img
                className="correctAnswerImage"
                src={imageUrl}
                alt={answerText}
                onError={() => setImgError(true)}
                style={showReveal ? {
                  position: 'absolute',
                  inset: 0,
                  clipPath: `inset(0 ${(1 - revealProgress) * 100}% 0 0)`,
                } : undefined}
              />
            </div>
          )}
          {answerText && <div className="correctAnswerText">{answerText}</div>}
        </div>
        {/* 右カラム */}
        <div className="correctRight">
          <div className={`correctWinnerLabel${isNoContest ? ' nocontest' : ''}`}>{winnerLabel}</div>
          {!isNoContest && (
            <div className={`correctPoints${scoreAnimating ? ' animating' : ''}`}>
              +{displayAward.toLocaleString()} 点
            </div>
          )}
        </div>
        {/* 下エリア */}
        <div className="correctScoreArea">
          {playerLabels.map((label, idx) => {
            const isWinner = !isNoContest && idx === playerIndex
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
