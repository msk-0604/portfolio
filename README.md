# 山本真樹 営業職応募ポートフォリオ

営業職への応募用ポートフォリオサイトです。
依存パッケージのない静的サイト（HTML / CSS）で、Vercel にそのまま公開できます。

## 構成

```
public/
  index.html   ページ本体（タイトル・説明文・OGP を含む）
  styles.css   スタイル（スマホ / PC / 印刷）
  main.js      ヘッダー・メニュー・進捗バー・スクロール表示・図の自動再生
.claude/       Claude Code 用設定（ターン終了時に変更を自動コミット・push するフック）
  favicon.svg
scripts/
  check.mjs    公開前チェック（リンク切れ・空リンク・仮文言・title/description）
vercel.json    出力先 public、noindex ヘッダー
```

## 確認

```bash
npm run check   # 公開前チェック（Vercel のビルドでも実行）
npm run dev     # http://localhost:3000 で表示
```

## Vercel で公開する

1. Vercel にログインし「Add New… → Project」から、このリポジトリ（`msk-0604/portfolio`）を新規プロジェクトとして Import する。
2. 設定は `vercel.json` に入っているため、Framework Preset は「Other」のまま Deploy する。

CLI の場合は、このディレクトリで `npx vercel` → `npx vercel --prod`。

検索結果に出ないよう `noindex` を設定しています。応募先へは URL を直接伝えてください。

## 内容を更新するとき

- 動きはライブラリを使わず CSS と JavaScript で実装しています（ヒーローの表示、流れのカード、キーワードの帯、スクロール表示、KENBEI の図の自動切り替え、管工事の図）。
- 内容が隠れたままにならないよう、JS が動かない・4 秒以内に読み込めない・「視差効果を減らす」設定・印刷のいずれでも全文を最初から表示します。繰り返す動きは画面に入っている間だけ再生します。
- 実績の図は HTML/CSS で描いたイメージ図で、実際の画面ではありません。
- 文章はすべて `public/index.html` にあります。
- 未確認の実績・数字・効果は掲載しない方針です。追加する場合は、事実と掲載許可を確認してから追記してください。
