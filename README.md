# 山本真樹 営業職応募ポートフォリオ

株式会社リーフワークス 営業職（法人営業・サポート）への応募用ポートフォリオサイトです。
依存パッケージのない静的サイト（HTML / CSS）で、Vercel にそのまま公開できます。

## 構成

```
public/
  index.html   ページ本体（タイトル・説明文・OGP を含む）
  styles.css   スタイル（スマホ / PC / 印刷）
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

- 文章はすべて `public/index.html` にあります。
- 未確認の実績・数字・効果は掲載しない方針です。追加する場合は、事実と掲載許可を確認してから追記してください。
