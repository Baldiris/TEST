const assert=require("node:assert/strict");
const fs=require("node:fs");

const html=fs.readFileSync("design-competition.html","utf8");
const css=fs.readFileSync("design-competition.css","utf8");
const js=fs.readFileSync("design-competition.js","utf8");

assert.equal((html.match(/data-entry-target=/g)||[]).length,3,"three navigation entries");
assert.equal((html.match(/data-entry-view=/g)||[]).length,3,"three independent layouts");
assert.equal((html.match(/data-vote-entry=/g)||[]).length,3,"each entry has its own vote action");

for(const marker of ["a-station-sign","a-route","b-board-wrap","b-drawer","c-ticket","c-log"]){
  assert.match(html,new RegExp(`class=["'][^"']*${marker}`),marker+" exists in HTML");
  assert.match(css,new RegExp(`\\.${marker}`),marker+" has dedicated CSS");
}
for(const entry of ["a","b","c"]){
  assert.match(js,new RegExp(`${entry}:`),entry+" entry metadata exists");
}
for(const id of ["voteResult","voteResultText","clearVoteButton"]){
  assert.match(html,new RegExp(`id=["']${id}["']`),`#${id} exists`);
}

assert.doesNotMatch(html,/data-theme=|class=["'][^"']*prototype/,"entries must not share a skinned prototype");
assert.doesNotMatch(html,/<table|★/,"comparison must not use a generic score table");
assert.doesNotMatch(css,/(?:linear|radial)-gradient|backdrop-filter|color-mix/,"avoid decorative AI-style effects");
assert.doesNotMatch(html,/<script[^>]+src=["']https?:/i,"no external script dependency");

console.log("Design competition ROUND 2 tests passed.");
