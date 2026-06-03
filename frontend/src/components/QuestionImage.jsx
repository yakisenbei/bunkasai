import React, { useEffect, useRef, useState } from 'react'
import {
  hashSeed,
  loadImage,
  prepareBlackoutBuffer,
  renderBlackoutFrame,
  shrinkRevealProgress,
} from '../lib/pixelBlackout'

export default function QuestionImage({
  src,
  hasBlackReveal,
  scale,
  initialZoom,
  minZoom,
  turn,
  imageName,
  effects,
}) {
  const canvasRef = useRef(null)
  const bufferRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!hasBlackReveal || !src) {
      bufferRef.current = null
      setReady(false)
      return undefined
    }

    let cancelled = false
    setReady(false)

    ;(async () => {
      try {
        const img = await loadImage(src)
        if (cancelled) return
        const seed = hashSeed(`${turn}|${imageName}|${(effects || []).join(',')}`)
        bufferRef.current = prepareBlackoutBuffer(img, seed)
        if (!cancelled) setReady(true)
      } catch {
        if (!cancelled) {
          bufferRef.current = null
          setReady(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [src, hasBlackReveal, turn, imageName, effects])

  useEffect(() => {
    if (!hasBlackReveal || !ready || !bufferRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return

    const progress = shrinkRevealProgress(scale, initialZoom, minZoom)
    const frame = renderBlackoutFrame(bufferRef.current, progress)
    canvas.width = frame.width
    canvas.height = frame.height
    const ctx = canvas.getContext('2d')
    ctx.putImageData(frame, 0, 0)
  }, [hasBlackReveal, ready, scale, initialZoom, minZoom])

  if (hasBlackReveal) {
    return (
      <canvas
        ref={canvasRef}
        className="questionImage questionCanvas"
        aria-label="question"
      />
    )
  }

  return <img className="questionImage" src={src} alt="question" />
}
