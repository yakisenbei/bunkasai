export const EFFECTS = [
  { id: 'invert', label: '色反転' },
  { id: 'mosaic', label: 'モザイク' },
  { id: 'grayscale', label: 'モノクロ' },
  { id: 'flip', label: '上下反転' },
  { id: 'black_reveal', label: '黒塗り復元' },
]

export const FRONTEND_ONLY_EFFECTS = new Set(['black_reveal'])

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
  const enabled =
    cfg.enabled_effects?.filter((id) => EFFECTS.some((e) => e.id === id)) ??
    EFFECTS.map((e) => e.id)
  return {
    effectCountWeights: cfg.effect_count_weights ?? [2, 5, 2, 1, 1, 1],
    maxEffectCount: cfg.max_effect_count ?? 5,
    enabledEffects: enabled.length ? enabled : EFFECTS.map((e) => e.id),
    mosaicBlockSize: cfg.mosaic_block_size ?? 16,
    preShrinkCountdownSec: cfg.pre_shrink_countdown_sec ?? 3,
    shrinkSpeed: cfg.shrink_speed ?? 0.12,
    initialZoom: cfg.initial_zoom ?? 4,
    minZoom: cfg.min_zoom ?? 1,
    overlayFadeInSec: cfg.overlay_fade_in_sec ?? 0.6,
    overlayFadeOutSec: cfg.overlay_fade_out_sec ?? 0.6,
    resultOverlayFadeInSec: cfg.result_overlay_fade_in_sec ?? 0.6,
    effectLabelRevealSec: cfg.effect_label_reveal_sec ?? 0.8,
    effectCountAnimSec: cfg.effect_count_anim_sec ?? 1,
    scoreCountAnimSec: cfg.score_count_anim_sec ?? 1,
    statsRevealDelaySec: cfg.stats_reveal_delay_sec ?? 0.2,
  }
}

export function settingsToApiPayload(settings) {
  return {
    effect_count_weights: settings.effectCountWeights,
    max_effect_count: settings.maxEffectCount,
    enabled_effects: settings.enabledEffects,
    mosaic_block_size: settings.mosaicBlockSize,
    pre_shrink_countdown_sec: settings.preShrinkCountdownSec,
    shrink_speed: settings.shrinkSpeed,
    initial_zoom: settings.initialZoom,
    min_zoom: settings.minZoom,
    overlay_fade_in_sec: settings.overlayFadeInSec,
    overlay_fade_out_sec: settings.overlayFadeOutSec,
    result_overlay_fade_in_sec: settings.resultOverlayFadeInSec,
    effect_label_reveal_sec: settings.effectLabelRevealSec,
    effect_count_anim_sec: settings.effectCountAnimSec,
    score_count_anim_sec: settings.scoreCountAnimSec,
    stats_reveal_delay_sec: settings.statsRevealDelaySec,
  }
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function randomFocus() {
  return { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.7 }
}
