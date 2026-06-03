import { EFFECTS } from './gameLogic'

export const ROULETTE_SPINNING_SEC = 4
/** react-roulette-pro の offset 計算と一致させる（Regular 既定 205x174 との不一致で終了時に1マスずれる） */
export const ROULETTE_PRIZE_WIDTH = 132
export const ROULETTE_PRIZE_HEIGHT = 88
export const ROULETTE_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#1e293b"/></svg>',
  )

function reproduceArray(array, length) {
  return Array.from({ length }, () => array[Math.floor(Math.random() * array.length)])
}

/** ratio: 当選 1 / 非当選 0（見た目用。結果は winIndex で固定） */
export function buildBasePrizes(items, winIndex) {
  return items.map((item, index) => ({
    id: item.id,
    text: item.text,
    image: ROULETTE_PLACEHOLDER,
    ratio: index === winIndex ? 1 : 0,
  }))
}

export function buildSpinningList(basePrizes, winIndex) {
  const prizeList = [
    ...basePrizes,
    ...reproduceArray(basePrizes, basePrizes.length * 3),
    ...basePrizes,
    ...reproduceArray(basePrizes, basePrizes.length),
  ].map((prize, index) => ({
    ...prize,
    id: `${prize.id}-${index}`,
  }))

  const prizeIndex = basePrizes.length * 4 + winIndex
  return { prizeList, prizeIndex }
}

export function buildCountRoulette(maxN, winCount) {
  const items = Array.from({ length: maxN + 1 }, (_, n) => ({
    id: `count-${n}`,
    text: String(n),
  }))
  const winIndex = Math.max(0, Math.min(maxN, winCount))
  const base = buildBasePrizes(items, winIndex)
  return buildSpinningList(base, winIndex)
}

export function buildEffectRoulette(enabledIds, winEffectId) {
  const options = enabledIds
    .map((id) => EFFECTS.find((e) => e.id === id))
    .filter(Boolean)
  const winIndex = Math.max(0, options.findIndex((e) => e.id === winEffectId))
  const items = options.map((e) => ({ id: e.id, text: e.label }))
  const base = buildBasePrizes(items, winIndex)
  return buildSpinningList(base, winIndex)
}

export function rouletteSpinMs() {
  return ROULETTE_SPINNING_SEC * 1000 + 350
}
