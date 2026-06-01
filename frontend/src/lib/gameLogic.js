export const EFFECTS = [
  { id: 'invert', label: '色反転' },
  { id: 'mosaic', label: 'モザイク' },
  { id: 'grayscale', label: 'モノクロ' },
  { id: 'flip', label: '上下反転' },
  { id: 'hide', label: '一部隠し' },
]

export const PHASE_LABELS = {
  idle: '待機',
  roulette_count: 'ルーレット（効果数）',
  roulette_effects: 'ルーレット（効果）',
  display: '画像表示',
  countdown: 'カウントダウン',
  shrinking: '縮小中',
  answering: '回答受付',
  correct: '正解処理',
  result: 'リザルト',
}

export function calcScore(n) {
  const clamped = Math.max(0, Math.min(5, Number(n) || 0))
  return Math.round(1000 * 1.5 ** clamped)
}

export function effectLabels(ids) {
  if (!ids?.length) return 'なし'
  const dict = new Map(EFFECTS.map((e) => [e.id, e.label]))
  return ids.map((id) => dict.get(id) || id).join(', ')
}

export function defaultSettings(cfg = {}) {
  return {
    effectCountWeights: cfg.effect_count_weights ?? [2, 5, 2, 1, 1, 1],
    preShrinkCountdownSec: cfg.pre_shrink_countdown_sec ?? 3,
    shrinkSpeed: cfg.shrink_speed ?? 0.12,
    initialZoom: cfg.initial_zoom ?? 4,
    minZoom: cfg.min_zoom ?? 1,
  }
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function randomFocus() {
  return { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.7 }
}
