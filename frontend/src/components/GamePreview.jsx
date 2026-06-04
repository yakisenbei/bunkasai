import React from 'react'

export default function GamePreview() {
  return (
    <section className="gamePreviewPanel">
      <div className="panelTitle">ゲーム画面</div>
      <div className="gamePreviewFrame">
        <iframe title="ゲーム画面プレビュー" src="/game" />
      </div>
    </section>
  )
}
