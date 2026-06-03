const BLACKOUT_RATIO = 0.9
const MAX_CANVAS_DIM = 640

export function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildBlackoutOrder(width, height, seed) {
  const total = width * height
  const rng = mulberry32(seed)
  const order = new Uint32Array(total)
  for (let i = 0; i < total; i += 1) order[i] = i
  for (let i = total - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = order[i]
    order[i] = order[j]
    order[j] = tmp
  }
  return order
}

export function shrinkRevealProgress(scale, initialZoom, minZoom) {
  if (initialZoom <= minZoom) return 1
  const t = (initialZoom - scale) / (initialZoom - minZoom)
  return Math.max(0, Math.min(1, t))
}

export function fitCanvasSize(imgW, imgH) {
  const scale = Math.min(1, MAX_CANVAS_DIM / Math.max(imgW, imgH))
  return {
    width: Math.max(1, Math.round(imgW * scale)),
    height: Math.max(1, Math.round(imgH * scale)),
  }
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    img.src = src
  })
}

export function prepareBlackoutBuffer(img, seed) {
  const { width, height } = fitCanvasSize(img.naturalWidth, img.naturalHeight)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, width, height)
  const original = ctx.getImageData(0, 0, width, height)
  const order = buildBlackoutOrder(width, height, seed)
  return { width, height, original, order }
}

export function renderBlackoutFrame(buffer, progress) {
  const { width, height, original, order } = buffer
  const total = width * height
  const blackCount = Math.floor(total * BLACKOUT_RATIO * (1 - progress))
  const out = new Uint8ClampedArray(original.data)
  for (let i = 0; i < blackCount; i += 1) {
    const px = order[i]
    const off = px * 4
    out[off] = 0
    out[off + 1] = 0
    out[off + 2] = 0
    out[off + 3] = 255
  }
  return new ImageData(out, width, height)
}
