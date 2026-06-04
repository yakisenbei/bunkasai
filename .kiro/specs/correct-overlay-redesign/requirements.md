# Requirements Document

## Introduction

文化祭イントロクイズゲームの正解時オーバーレイ（`CorrectOverlay.jsx`）を、現行の中央1カードレイアウトから3エリア構成にリデザインする機能要件を定義する。
左カラムに未加工画像と正解テキスト、右カラムに正解者名と獲得点数アニメーション、下エリアに全プレイヤーのスコア推移（正解前→正解後、正解者ハイライト）を表示する。
あわせて `AdminScreen.jsx` 側で `correctReveal` に `imageName` フィールドを追加する。

## Glossary

- **CorrectOverlay**: 正解時にフルスクリーン表示されるオーバーレイコンポーネント
- **correctReveal**: 正解情報（正解者インデックス、獲得点数、正解前スコア、ID、画像名）を持つオブジェクト
- **imageName**: 出題された画像のファイル名（例: `イルカ.jpg`）
- **answerText**: imageName から拡張子を除いた正解テキスト（例: `イルカ`）
- **stripExtension**: ファイル名から最後の拡張子を除去するピュア関数
- **scoresBefore**: 正解前の各プレイヤーのスコア配列
- **pointsAwarded**: 正解者に付与される得点
- **playerIndex**: 正解者のプレイヤーインデックス（0〜4）
- **winnerLabel**: playerLabels[playerIndex] で解決される正解者の表示名
- **PLAYER_LABELS**: `['P1', 'P2', 'P3', 'P4', 'P5']` の固定ラベル配列
- **animateNumber**: 数値をアニメーションでカウントアップするユーティリティ関数
- **AdminScreen**: 管理者が正解判定などのゲーム進行を操作する画面
- **GameScreen**: プレイヤーに表示されるゲーム画面

## Requirements

### Requirement 1: 3エリアレイアウトの適用

**User Story:** As a 観客・プレイヤー, I want 正解時に画像・正解名・正解者・スコアが整理されたレイアウトで表示されること, so that 正解内容と点数変動を一目で確認できる

#### Acceptance Criteria

1. WHEN 正解フェーズ（phase === 'correct'）に遷移したとき, THE CorrectOverlay SHALL 左カラム・右カラム・下エリアの3エリア構成で表示される
2. THE CorrectOverlay SHALL CSS Grid を用いて「左カラム | 右カラム」の上段と「下エリア」の下段の2行レイアウトを構成する
3. WHEN correctReveal.imageName が null でないとき, THE CorrectOverlay SHALL 左カラムに `/images/{encodeURIComponent(imageName)}` から取得した未加工画像を表示する
4. WHEN correctReveal.imageName が null のとき, THE CorrectOverlay SHALL 左カラムに画像要素を表示しない
5. THE CorrectOverlay SHALL 左カラムに answerText（stripExtension(imageName) の結果）を大きいテキストとして表示する
6. THE CorrectOverlay SHALL 右カラムに winnerLabel を大きなフォントで表示する
7. THE CorrectOverlay SHALL 右カラムに獲得点数（displayAward）を `+{n} 点` 形式でアニメーションつきで表示する
8. THE CorrectOverlay SHALL 下エリアに全プレイヤーのスコア推移（`scoresBefore[i] → displayScores[i]`）を表示する
9. WHEN プレイヤーが正解者（idx === playerIndex）のとき, THE CorrectOverlay SHALL そのスコア行をハイライト表示する

### Requirement 2: imageName の correctReveal への追加

**User Story:** As a 管理者, I want 正解ボタンを押したときに現在の出題画像名が correctReveal に含まれること, so that CorrectOverlay が正しい未加工画像を表示できる

#### Acceptance Criteria

1. WHEN 管理者が正解ボタンを押したとき, THE AdminScreen SHALL `state.currentImage` の値を `correctReveal.imageName` として patch に含める
2. WHEN `state.currentImage` が null のとき, THE AdminScreen SHALL `correctReveal.imageName` を null として patch する
3. THE AdminScreen SHALL `correctReveal` オブジェクトに `id`, `playerIndex`, `pointsAwarded`, `scoresBefore`, `imageName` の5フィールドをすべて含める

### Requirement 3: stripExtension 関数

**User Story:** As a 開発者, I want ファイル名から拡張子を除去する純粋関数が存在すること, so that imageName から正解テキストを安全に導出できる

#### Acceptance Criteria

1. WHEN stripExtension に拡張子ありのファイル名（例: `イルカ.jpg`）を渡したとき, THE stripExtension SHALL 最後の `.` 以降を除いた文字列（例: `イルカ`）を返す
2. WHEN stripExtension に拡張子なしのファイル名（例: `サグラダファミリア`）を渡したとき, THE stripExtension SHALL 入力文字列をそのまま返す
3. WHEN stripExtension に null または undefined を渡したとき, THE stripExtension SHALL 空文字列を返す
4. THE stripExtension SHALL 副作用を持たないピュア関数である
5. FOR ALL 有効なファイル名 f, stripExtension(stripExtension(f)) SHALL stripExtension(f) と等しい（冪等性）

### Requirement 4: スコアアニメーション

**User Story:** As a 観客・プレイヤー, I want 獲得点数がカウントアップアニメーションで表示されること, so that 点数の付与を視覚的に楽しめる

#### Acceptance Criteria

1. WHEN 正解オーバーレイが表示されてから `correctScoreDelaySec` 秒経過したとき, THE CorrectOverlay SHALL animateNumber を使い displayAward を 1 から pointsAwarded へカウントアップアニメーションする
2. WHEN アニメーションが完了したとき, THE CorrectOverlay SHALL `displayScores[playerIndex]` を `scoresBefore[playerIndex] + pointsAwarded` に更新する
3. WHEN アニメーションが完了したとき, THE CorrectOverlay SHALL `onScoreAnimationComplete` コールバックを呼び出す（スコア更新とコールバック呼び出しは独立した操作であり、それぞれ個別に失敗し得る）
4. FOR ALL correctReveal.id, THE CorrectOverlay SHALL `onScoreAnimationComplete` をその id につき厳密に1回だけ呼び出す
5. WHILE アニメーション中, THE CorrectOverlay SHALL 非正解者の `displayScores[idx]` を `scoresBefore[idx]` のまま維持する

### Requirement 5: 画像読み込みエラー処理

**User Story:** As a 観客・プレイヤー, I want 画像が取得できない場合でも正解テキストとスコアが表示されること, so that 通信エラー時もゲーム進行が止まらない

#### Acceptance Criteria

1. IF `/images/{imageName}` の読み込みに失敗した場合, THEN THE CorrectOverlay SHALL 画像要素を非表示またはプレースホルダーに差し替えるか、そのまま表示継続とする
2. IF 画像読み込みエラーが発生した場合, THEN THE CorrectOverlay SHALL answerText の表示を継続する
3. IF 画像読み込みエラーが発生した場合, THEN THE CorrectOverlay SHALL 右カラムおよび下エリアの表示を継続する

### Requirement 6: Confetti（紙吹雪）の維持

**User Story:** As a 観客・プレイヤー, I want 正解時に紙吹雪が表示されること, so that 正解の祝祭感を演出できる

#### Acceptance Criteria

1. WHEN 正解オーバーレイが表示されるとき, THE CorrectOverlay SHALL react-confetti を用いた紙吹雪を表示する
2. THE CorrectOverlay SHALL `settings.confettiPieces` の値（0を含む）をそのまま紙吹雪の数に適用する
3. THE CorrectOverlay SHALL `settings.confettiGravity` の値を紙吹雪の重力に適用する
