import React, { useCallback, useEffect, useMemo, useState } from 'react'
import RoulettePro from 'react-roulette-pro'
import 'react-roulette-pro/dist/index.css'
import { EFFECTS } from '../lib/gameLogic'
import {
  buildCountRoulette,
  buildEffectRoulette,
  ROULETTE_PRIZE_HEIGHT,
  ROULETTE_PRIZE_WIDTH,
  ROULETTE_SPINNING_SEC,
} from '../lib/rouletteUtils'

function renderRoulettePrize(item) {
  return (
    <div
      className="roulettePrizeCell"
      style={{ width: ROULETTE_PRIZE_WIDTH, height: ROULETTE_PRIZE_HEIGHT }}
    >
      <span>{item.text}</span>
    </div>
  )
}

function quizRouletteDesign() {
  return {
    topChildren: null,
    bottomChildren: null,
    prizeItemWidth: ROULETTE_PRIZE_WIDTH,
    prizeItemHeight: ROULETTE_PRIZE_HEIGHT,
    prizeItemRenderFunction: renderRoulettePrize,
    classes: {
      prizeItem: 'roulette-pro-quiz-prize-item',
    },
  }
}

function RouletteSpin({ prizeList, prizeIndex, spinKey, className, spinningSec }) {
  const [start, setStart] = useState(false)
  const designPlugin = useCallback(() => quizRouletteDesign(), [])

  useEffect(() => {
    setStart(false)
    const id = window.setTimeout(() => setStart(true), 80)
    return () => window.clearTimeout(id)
  }, [spinKey, prizeIndex])

  return (
    <div className={className}>
      <RoulettePro
        prizes={prizeList}
        prizeIndex={prizeIndex}
        start={start}
        spinningTime={spinningSec}
        type="horizontal"
        designPlugin={designPlugin}
        options={{ stopInCenter: true }}
        classes={{ wrapper: 'rouletteProWrapper', prizeListWrapper: 'rouletteProList' }}
      />
    </div>
  )
}

/** ルーレット本体のみ（暗転は GameScreen の StageDimBackdrop が担当） */
export default function RouletteOverlay({
  phase,
  rouletteDisplay,
  maxEffectCount,
  enabledEffects,
  spinningSec = ROULETTE_SPINNING_SEC,
}) {
  const spinKey = rouletteDisplay?.spinKey ?? 0
  const effectCount = rouletteDisplay?.effectCount ?? 0
  const effects = rouletteDisplay?.effects ?? []
  const maxN = rouletteDisplay?.maxEffectCount ?? maxEffectCount ?? 5
  const enabledIds =
    rouletteDisplay?.enabledEffects ??
    enabledEffects ??
    EFFECTS.map((e) => e.id)

  const countRoulette = useMemo(
    () => buildCountRoulette(maxN, effectCount),
    [maxN, effectCount, spinKey, phase],
  )

  const effectRoulettes = useMemo(() => {
    if (phase !== 'roulette_effects') return []
    return effects.map((effectId, index) => ({
      key: `${spinKey}-${effectId}-${index}`,
      ...buildEffectRoulette(enabledIds, effectId),
    }))
  }, [phase, effects, enabledIds, spinKey])

  const isCount = phase === 'roulette_count'
  const isEffects = phase === 'roulette_effects'

  return (
    <div className="rouletteStageOverlay" aria-hidden={false}>
      <div className="rouletteStageContent">
        {isCount && (
          <>
            <div className="rouletteStageTitle">効果数ルーレット</div>
            <RouletteSpin
              className="rouletteStageSingle"
              prizeList={countRoulette.prizeList}
              prizeIndex={countRoulette.prizeIndex}
              spinKey={`count-${spinKey}`}
              spinningSec={spinningSec}
            />
          </>
        )}
        {isEffects && (
          <>
            <div className="rouletteStageTitle">効果ルーレット</div>
            <div className="rouletteStageCountBadge">効果数: {effectCount}</div>
            {effectCount === 0 ? (
              <div className="rouletteStageEmpty">効果なし</div>
            ) : (
              <div className="rouletteStageGrid">
                {effectRoulettes.map((roulette, index) => (
                  <div key={roulette.key} className="rouletteStageItem">
                    <div className="rouletteStageItemLabel">#{index + 1}</div>
                    <RouletteSpin
                      className="rouletteStageSingle"
                      prizeList={roulette.prizeList}
                      prizeIndex={roulette.prizeIndex}
                      spinKey={roulette.key}
                      spinningSec={spinningSec}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
