import React from 'react'
import { clickToFocusCenter } from '../lib/imageUtils'

export default function ImageFocusPicker({
  imageName,
  focusCenter,
  useRandomCenter,
  disabled,
  onPickFocus,
  onToggleRandom,
}) {
  if (!imageName) {
    return <div className="emptyHint">画像を選択してください</div>
  }

  const src = `/images/${encodeURIComponent(imageName)}`
  const focus = focusCenter || { x: 0.5, y: 0.5 }

  const handleClick = (e) => {
    if (disabled || useRandomCenter) return
    onPickFocus(clickToFocusCenter(e))
  }

  return (
    <div className="focusPicker">
      <p className="muted focusPickerHint">
        {useRandomCenter
          ? 'ランダム中心が有効です（チェックを外してクリックで指定）'
          : '画像をクリックして拡大の中心位置を指定'}
      </p>
      <div
        className={
          disabled
            ? 'focusPickerFrame disabled'
            : useRandomCenter
              ? 'focusPickerFrame random'
              : 'focusPickerFrame'
        }
        onClick={handleClick}
        role="presentation"
      >
        <img className="focusPickerImage" src={src} alt={imageName} draggable={false} />
        {!useRandomCenter && (
          <div
            className="focusPickerMarker"
            style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }}
          />
        )}
      </div>
      <label className="checkRow">
        <input
          type="checkbox"
          checked={useRandomCenter}
          disabled={disabled}
          onChange={(e) => onToggleRandom(e.target.checked)}
        />
        拡大中心をランダムにする
      </label>
      {!useRandomCenter && (
        <div className="focusPickerCoords muted">
          中心: ({focus.x.toFixed(2)}, {focus.y.toFixed(2)})
        </div>
      )}
    </div>
  )
}
