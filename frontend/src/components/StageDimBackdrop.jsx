import React, { useEffect, useState } from 'react'

/** 画面全体の薄暗いオーバーレイ（opacity 0〜1 を CSS transition、0 でもフェードアウト完了まで表示） */
export default function StageDimBackdrop({
  opacity,
  maxOpacity = 0.68,
  zIndex = 940,
  transitionSec = 0.6,
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (opacity > 0) {
      setMounted(true)
      return undefined
    }
    const t = window.setTimeout(() => setMounted(false), transitionSec * 1000 + 80)
    return () => window.clearTimeout(t)
  }, [opacity, transitionSec])

  if (!mounted) return null

  return (
    <div
      className="stageDimBackdrop"
      style={{
        opacity: opacity * maxOpacity,
        zIndex,
        transition: `opacity ${transitionSec}s ease`,
        pointerEvents: opacity > 0.02 ? 'auto' : 'none',
      }}
      aria-hidden
    />
  )
}
