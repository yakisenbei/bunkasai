# イントロクイズ (開発用リポジトリ)

このフォルダは文化祭用イントロクイズの実装ワークスペースです。簡易なバックエンド（FastAPI）とフロントエンド（Vite + React）のスケルトンを含みます。

簡単な実行手順（ローカル開発）

1. Python 仮想環境を有効化（あなたの venv を利用）

```bash
source /home/yakisenbei/Documents/bunkasai/bin/activate
```

1. バックエンド依存をインストールして起動

```bash
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

1. フロントエンド（別ターミナル）

```bash
cd frontend
npm install
npm run dev
```

注意:

- `ffmpeg` バイナリが別途必要です。画像効果は今はプレースホルダ実装です。実際の ffmpeg フィルタは `backend/app.py` に追加してください。
- 画像は `backend/images/` に配置してください。処理結果は `backend/processed/` から配信されます。
