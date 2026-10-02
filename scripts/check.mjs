// 公開前チェック（依存パッケージなし）。Vercel のビルドでも実行される。
// - 必須ファイル・title・description の有無
// - ページ内リンク（#id）の参照先が存在するか
// - 空リンクや仮の文言が残っていないか
// - 外部リンクに rel="noopener" が付いているか
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const errors = [];

for (const file of ["index.html", "styles.css", "favicon.svg"]) {
  if (!existsSync(join(root, file))) errors.push(`missing file: ${file}`);
}

const html = readFileSync(join(root, "index.html"), "utf8");

if (!/<title>[^<]+<\/title>/.test(html)) errors.push("missing <title>");
if (!/<meta name="description" content="[^"]{20,}">/.test(html)) {
  errors.push("missing or short meta description");
}

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const [, href] of html.matchAll(/href="([^"]*)"/g)) {
  if (href === "" || href === "#") errors.push(`empty link: href="${href}"`);
  else if (href.startsWith("#") && !ids.has(href.slice(1))) {
    errors.push(`broken in-page link: ${href}`);
  } else if (!/^(https?:|#|mailto:)/.test(href) && !existsSync(join(root, href))) {
    errors.push(`missing local file: ${href}`);
  }
}

for (const [tag] of html.matchAll(/<a [^>]*target="_blank"[^>]*>/g)) {
  if (!tag.includes('rel="noopener')) errors.push(`target=_blank without rel: ${tag}`);
}

const placeholders = ["準備中", "Coming soon", "TODO", "lorem", "ダミー", "サンプル", "XXX", "javascript:"];
for (const word of placeholders) {
  if (html.toLowerCase().includes(word.toLowerCase())) errors.push(`placeholder text found: ${word}`);
}

if (errors.length) {
  console.error("Check failed:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`Check passed: ${ids.size} ids, links OK, no placeholders.`);
