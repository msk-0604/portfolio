#!/usr/bin/env bash
# Stop フック: ターンの終わりに未コミットの変更があれば、コミットして現在のブランチへ push する。
set -u
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

branch=$(git symbolic-ref --short HEAD 2>/dev/null) || exit 0
[ -n "$(git status --porcelain)" ] || exit 0

# 公開前チェックが通らない状態ではコミットしない
if [ -f package.json ] && ! npm run -s check >/tmp/auto-commit-check.log 2>&1; then
  echo '{"systemMessage":"自動コミットを中止しました: npm run check が失敗しています"}'
  exit 0
fi

git add -A
files=$(git diff --cached --name-only | head -5 | tr '\n' ' ')
git commit -q -m "自動コミット: ${files}" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || exit 0

for delay in 0 2 4 8 16; do
  sleep "$delay"
  if git push -q -u origin "$branch" 2>/tmp/auto-commit-push.log; then
    echo "{\"systemMessage\":\"自動コミットして ${branch} へ push しました\"}"
    exit 0
  fi
done
echo '{"systemMessage":"自動コミットはしましたが push に失敗しました（/tmp/auto-commit-push.log）"}'
exit 0
