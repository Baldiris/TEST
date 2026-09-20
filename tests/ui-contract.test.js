const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const js = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

const ids = [...js.matchAll(/\$\("([^"]+)"\)/g)].map(match => match[1]);
for (const id of new Set(ids)) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `#${id} must exist in index.html`);
}

assert.match(html, /きまぐれメトロ旅 V0\.5/);
assert.match(js, /const VERSION="0\.5"/);
assert.ok(html.indexOf('id="dicePanel"') < html.indexOf('class="panel network-panel"'), "dice controls must appear before the wide board");
assert.match(html, /id="candidateList"/);
assert.match(html, /id="routeCompass"/);
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
assert.doesNotMatch(html, /<script[^>]+src=["']https?:/i, "the app must remain dependency-free");

console.log("UI contract tests passed.");
