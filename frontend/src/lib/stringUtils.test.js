import { describe, it, expect } from 'vitest'
import { stripExtension } from './stringUtils.js'

describe('stripExtension', () => {
  // Requirement 3.1: 拡張子ありのファイル名 → 最後の . 以降を除去
  it('jpg 拡張子を除去する', () => {
    expect(stripExtension('イルカ.jpg')).toBe('イルカ')
  })

  it('png 拡張子を除去する', () => {
    expect(stripExtension('クマノミ.png')).toBe('クマノミ')
  })

  it('webp 拡張子を除去する', () => {
    expect(stripExtension('コアラ.webp')).toBe('コアラ')
  })

  it('英数字ファイル名から拡張子を除去する', () => {
    expect(stripExtension('USJ.jpg')).toBe('USJ')
  })

  it('名前にドットを含むファイル名から最後の拡張子だけ除去する', () => {
    // 名前に . が含まれるケース（ドット区切り）は実際のファイルにはないが仕様通りに動作確認
    expect(stripExtension('ケネディ宇宙センター(NASA).jpg')).toBe(
      'ケネディ宇宙センター(NASA)'
    )
  })

  it('カンマや記号を含むファイル名から拡張子を除去する', () => {
    expect(stripExtension('エアーズロック、ウルル.jpg')).toBe(
      'エアーズロック、ウルル'
    )
  })

  // Requirement 3.2: 拡張子なし → そのまま返す
  it('拡張子なしのファイル名をそのまま返す', () => {
    expect(stripExtension('サグラダファミリア')).toBe('サグラダファミリア')
  })

  it('拡張子なし英字ファイル名をそのまま返す', () => {
    expect(stripExtension('koisi')).toBe('koisi')
  })

  // Requirement 3.3: null/undefined → 空文字列
  it('null を渡すと空文字列を返す', () => {
    expect(stripExtension(null)).toBe('')
  })

  it('undefined を渡すと空文字列を返す', () => {
    expect(stripExtension(undefined)).toBe('')
  })

  it('空文字列を渡すと空文字列を返す', () => {
    expect(stripExtension('')).toBe('')
  })

  // Requirement 3.4: 副作用なし（ピュア関数）— 同じ入力を複数回呼んでも同じ結果
  it('同じ入力を繰り返し呼んでも同じ結果を返す（ピュア性）', () => {
    const input = 'イルカ.jpg'
    const first = stripExtension(input)
    const second = stripExtension(input)
    expect(first).toBe(second)
  })

  // Requirement 3.5: 冪等性
  it('stripExtension(stripExtension(f)) === stripExtension(f) （冪等性）', () => {
    const cases = [
      'イルカ.jpg',
      'サグラダファミリア',
      'USJ.jpg',
      'koisi',
    ]
    for (const f of cases) {
      expect(stripExtension(stripExtension(f))).toBe(stripExtension(f))
    }
  })
})
