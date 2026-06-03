export function animateNumber(from, to, durationMs, onUpdate) {
  return new Promise((resolve) => {
    if (durationMs <= 0) {
      onUpdate(to)
      resolve()
      return
    }
    const start = performance.now()
    const diff = to - from
    const step = (now) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = t
      const value = Math.round(from + diff * eased)
      onUpdate(value)
      if (t < 1) {
        requestAnimationFrame(step)
      } else {
        onUpdate(to)
        resolve()
      }
    }
    requestAnimationFrame(step)
  })
}

export function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
