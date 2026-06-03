export function nextImageInList(images, current) {
  if (!images?.length) return null
  const idx = images.indexOf(current)
  if (idx === -1) return images[0]
  return images[(idx + 1) % images.length]
}

export function clickToFocusCenter(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height
  return {
    x: Math.max(0.05, Math.min(0.95, x)),
    y: Math.max(0.05, Math.min(0.95, y)),
  }
}
