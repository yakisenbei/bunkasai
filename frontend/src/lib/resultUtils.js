import { useEffect, useState } from 'react'

export function useWindowSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }))

  useEffect(() => {
    const onResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return size
}

export function getResultStandings(scores, labels) {
  const rows = scores.map((score, index) => ({
    index,
    label: labels[index] ?? `P${index + 1}`,
    score: score ?? 0,
  }))
  const maxScore = Math.max(...rows.map((r) => r.score), 0)
  const winners = rows.filter((r) => r.score === maxScore)
  return { rows, winners, maxScore }
}
