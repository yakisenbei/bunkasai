/**
 * ファイル名から最後の拡張子を除去するピュア関数。
 *
 * @param {string|null|undefined} filename - 入力ファイル名
 * @returns {string} 拡張子を除去した文字列。null/undefined の場合は空文字列を返す。
 *
 * @example
 * stripExtension('イルカ.jpg')          // → 'イルカ'
 * stripExtension('サグラダファミリア')  // → 'サグラダファミリア'
 * stripExtension(null)                  // → ''
 * stripExtension(undefined)            // → ''
 */
export function stripExtension(filename) {
  if (!filename) return ''
  return filename.replace(/\.[^/.]+$/, '')
}
