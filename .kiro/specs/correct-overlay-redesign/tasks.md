# Implementation Plan: CorrectOverlay レイアウトリデザイン

## Overview

`CorrectOverlay.jsx` を現行の中央1カード構成から「左カラム（画像＋正解テキスト）」「右カラム（正解者名＋獲得点数）」「下エリア（全スコア推移）」の3エリアレイアウトに全面書き換えする。
あわせて `AdminScreen.jsx` で `correctReveal` に `imageName` フィールドを追加し、`styles.css` に新レイアウト用のCSSクラスを追加する。

## Tasks

- [x] 1. stripExtension 関数の実装とテスト環境のセットアップ
  - `frontend/src/lib/gameLogic.js` または新ファイル `frontend/src/lib/stringUtils.js` に `stripExtension` ピュア関数を追加する
  - 関数シグネチャ: `function stripExtension(filename) { if (!filename) return ''; return filename.replace(/\.[^/.]+$/, '') }`
  - null/undefined → 空文字列、拡張子あり → 最後の`.`以降を除去、拡張子なし → そのまま返す
  - _要件: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 1.1 stringUtils.js を作成し stripExtension を実装する
    - `frontend/src/lib/stringUtils.js` を新規作成
    - `stripExtension` 関数をエクスポート
    - _要件: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 1.2 vitest と @vitest/ui のインストール・設定（任意）
    - `package.json` に `vitest` を devDependency として追加するコマンドを記録する
    - `vite.config.js` に `test` セクションを追加する（環境: jsdom）
    - _要件: 3.5_

  - [ ]* 1.3 stripExtension のプロパティテストを記述する
    - **Property 6: stripExtension の冪等性** — `stripExtension(stripExtension(f)) === stripExtension(f)`
    - **Property 7: stripExtension の拡張子除去** — 拡張子ありの入力に対し返り値の末尾にドットが含まれない
    - **要件: 3.5, 3.1**

  - [ ]* 1.4 stripExtension の単体テストを記述する
    - `イルカ.jpg` → `イルカ`、`サグラダファミリア` → `サグラダファミリア`、`null` → `""`、`ケネディ宇宙センター(NASA).jpg` → `ケネディ宇宙センター(NASA)` を確認
    - _要件: 3.1, 3.2, 3.3_

- [x] 2. AdminScreen.jsx の correctReveal に imageName フィールドを追加する
  - `handleCorrect` 関数内の `patch({ ... correctReveal: { ... } })` に `imageName: state.currentImage` を追加する
  - 5フィールド `id, playerIndex, pointsAwarded, scoresBefore, imageName` がすべて含まれることを確認
  - _要件: 2.1, 2.2, 2.3_

  - [x] 2.1 handleCorrect 内の correctReveal patch に imageName を追加する
    - `state.currentImage` が null の場合も `imageName: null` として渡す（フォールバックは CorrectOverlay 側で処理）
    - _要件: 2.1, 2.2, 2.3_

  - [ ]* 2.2 imageName 付与のプロパティテストを記述する
    - **Property 8: correctReveal に必要フィールドの存在** — patch オブジェクトに `id, playerIndex, pointsAwarded, scoresBefore, imageName` の5フィールドが存在し、`imageName === state.currentImage`
    - **要件: 2.1, 2.3**

- [x] 3. styles.css に3エリアレイアウト用CSSクラスを追加する
  - 旧 `correctCard` 系クラス（`.correctCard`, `.correctTitle`, `.correctWinner`, `.correctPoints`, `.correctScoreList`, `.correctScoreItem`）は削除または上書き
  - 新クラスを追加: `.correctLayout`, `.correctLeft`, `.correctRight`, `.correctScoreArea`, `.correctScoreRow`, `.correctScoreName`, `.correctScoreChange`, `.correctAnswerImage`, `.correctAnswerText`, `.correctWinnerLabel`
  - _要件: 1.1, 1.2_

  - [x] 3.1 旧 correctCard 系CSSクラスを削除する
    - `styles.css` から `.correctCard`, `.correctTitle`, `.correctWinner`, `.correctPoints.*`, `.correctScoreList`, `.correctScoreItem.*` を削除する
    - `.correctOverlay`, `.correctBackdrop` は維持する
    - _要件: 1.1_

  - [x] 3.2 新3エリアレイアウト用CSSクラスを追加する
    - `.correctLayout`: CSS Grid、`grid-template-columns: 1fr 1fr`、`grid-template-rows: 1fr auto`、`width: min(96vw, 1200px)`、`height: min(90vh, 700px)`
    - `.correctLeft`: 左カラム、`display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 24px`
    - `.correctRight`: 右カラム、`display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px`
    - `.correctScoreArea`: 下エリア、`grid-column: 1 / -1; display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; padding: 12px 16px`
    - `.correctAnswerImage`: `max-width: 100%; max-height: 45vh; object-fit: contain; border-radius: 12px`
    - `.correctAnswerText`: 大フォント、`font-size: 48px; font-weight: 900; color: #fff; text-align: center`
    - `.correctWinnerLabel`: 大フォント、`font-size: 56px; font-weight: 900; color: #fff`
    - `.correctPoints` (新): `font-size: 36px; font-weight: 800; color: #fbbf24` / `.correctPoints.animating`: `color: #fde047`
    - `.correctScoreRow`: `display: flex; flex-direction: column; align-items: center; padding: 8px; border-radius: 10px; border: 1px solid #223044; background: rgba(11,15,20,.8)`
    - `.correctScoreRow.winner`: `border-color: #22c55e; background: rgba(15,40,25,.9)`
    - `.correctScoreName`, `.correctScoreChange`: スコア推移テキストスタイル
    - _要件: 1.1, 1.2, 1.8, 1.9_

- [x] 4. CorrectOverlay.jsx を3エリアレイアウトに全面書き換えする
  - `stripExtension` を `../lib/stringUtils` からインポート
  - `imageName` を `correctReveal` から分割代入で取得
  - `imageUrl` を `imageName ? \`/images/${encodeURIComponent(imageName)}\` : null` で構築
  - `answerText` を `stripExtension(imageName)` で導出
  - 画像の `onError` ハンドラでエラー時に画像非表示フォールバックを実装
  - 既存の Confetti・アニメーションロジック（`animateNumber`, `useEffect`）は維持
  - スコア表示を `scoresBefore[i] → displayScores[i]` 形式に変更
  - _要件: 1.1〜1.9, 4.1〜4.5, 5.1〜5.3, 6.1〜6.3_

  - [x] 4.1 CorrectOverlay.jsx に stripExtension インポートと imageName 処理を追加する
    - `import { stripExtension } from '../lib/stringUtils'` を追加
    - `const { playerIndex, pointsAwarded, scoresBefore, imageName } = correctReveal` に変更
    - `imageUrl` と `answerText` の定数を導出
    - _要件: 1.3, 1.4, 1.5, 3.1〜3.4_

  - [x] 4.2 JSX を3エリアレイアウトに書き換える
    - `<div className="correctCard">` → `<div className="correctLayout">` に変更
    - 左カラム: `<div className="correctLeft">` 内に `<img>` (imageUrl があるとき) と `<div className="correctAnswerText">{answerText}</div>`
    - 右カラム: `<div className="correctRight">` 内に `<div className="correctWinnerLabel">` と `<div className="correctPoints">`
    - 下エリア: `<div className="correctScoreArea">` 内に `playerLabels.map(...)` でスコア推移行を生成
    - _要件: 1.1, 1.2, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [x] 4.3 画像onErrorフォールバックと imageName=null 時の条件レンダリングを実装する
    - `const [imgError, setImgError] = useState(false)` を追加
    - `<img onError={() => setImgError(true)} />` でエラーハンドリング
    - `imageUrl && !imgError` のときのみ `<img>` を表示
    - _要件: 5.1, 5.2, 5.3, 1.3, 1.4_

  - [x] 4.4 スコア推移表示を `scoresBefore[i] → displayScores[i]` 形式に更新する
    - 各スコア行: `{(baseScores[idx] ?? 0).toLocaleString()} → {(displayScores[idx] ?? 0).toLocaleString()}`
    - 正解者行には `winner` クラスを追加
    - _要件: 1.8, 1.9, 4.5_

  - [ ]* 4.5 CorrectOverlay の主要プロパティテストを記述する
    - **Property 1: 画像URL構築の正確性** — imageName が null でないとき `<img>.src` が `/images/{encodeURIComponent(imageName)}` と等しい
    - **Property 2: 正解テキスト表示の一貫性** — answerText が `stripExtension(imageName)` と等しくレンダリング結果に含まれる
    - **Property 3: 正解者名の表示** — 右カラムに `playerLabels[playerIndex]` が含まれる
    - **Property 9: Confetti 設定の反映** — `numberOfPieces === settings.confettiPieces`、`gravity === settings.confettiGravity`
    - **要件: 1.3, 1.5, 1.6, 6.2, 6.3**

  - [ ]* 4.6 スコアアニメーションのプロパティテストを記述する
    - **Property 4: スコア整合性（アニメーション完了後）** — `displayScores[playerIndex] === scoresBefore[playerIndex] + pointsAwarded`、非正解者は変化なし
    - **Property 5: onScoreAnimationComplete の呼び出し回数** — 同一 `correctReveal.id` につき厳密に1回だけ呼び出される
    - **要件: 4.2, 4.4, 4.5**

- [ ] 5. チェックポイント — すべてのテストを確認してください
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- `*` のついたタスクはオプションであり、MVPでスキップ可能
- 各タスクは要件番号で紐付けされている
- 既存の Confetti / animateNumber ロジックは維持し、触らない
- 旧 `correctCard` 系CSS削除前に、他コンポーネントで参照していないことを確認（検索では `CorrectOverlay.jsx` のみ）
- AdminScreen.jsx の `handleCorrect` は1箇所のみ（L140付近）

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "3.2"] },
    { "id": 2, "tasks": ["1.3", "1.4", "2.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 4, "tasks": ["4.5", "4.6"] }
  ]
}
```
