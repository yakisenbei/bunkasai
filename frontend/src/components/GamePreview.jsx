import React from 'react'

export default function GamePreview() {
  return (
    <section className="gamePreviewPanel">
      <div className="panelTitle">ゲーム画面</div>
      <p className="muted gamePreviewHint">会場表示と同期されます（/game と同じ内容）</p>
      <div className="gamePreviewFrame">
        <iframe title="ゲーム画面プレビュー" src="/game" />
      </div>
    </section>
  )
}
