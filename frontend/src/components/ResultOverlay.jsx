import React, { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import { getResultStandings, useWindowSize } from '../lib/resultUtils'

export default function ResultOverlay({ scores, playerLabels, fadeInSec = 0.6 }) {
  const { width, height } = useWindowSize()
  const { rows, winners, maxScore } = getResultStandings(scores, playerLabels)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    setOpacity(0)
    const id = window.requestAnimationFrame(() => setOpacity(1))
    return () => window.cancelAnimationFrame(id)
  }, [])

  const winnerText =
    winners.length === 0
      ? '---'
      : winners.length === 1
        ? `${winners[0].label}  の勝利！`
        : `${winners.map((w) => w.label).join(' / ')}  の同点勝利！`

  const transition = `opacity ${fadeInSec}s ease`

  return (
    <div className="resultOverlay" role="dialog" aria-label="リザルト">
      <Confetti
        width={width}
        height={height}
        recycle
        numberOfPieces={320}
        gravity={0.22}
      />
      <div className="resultBackdrop" style={{ opacity: opacity * 0.62, transition }} />
      <div className="resultCard" style={{ opacity, transition }}>
        <div className="resultTitle">リザルト</div>
        <div className="resultWinner">{winnerText}</div>
        <div className="resultWinnerScore">{maxScore.toLocaleString()} 点</div>
        <ul className="resultScoreList">
          {rows.map((row) => {
            const isWinner = row.score === maxScore
            return (
              <li key={row.label} className={isWinner ? 'resultScoreItem winner' : 'resultScoreItem'}>
                <span className="resultScoreName">{row.label}</span>
                <span className="resultScoreValue">{row.score.toLocaleString()}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
