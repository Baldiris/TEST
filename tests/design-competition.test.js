const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("design-competition.html", "utf8");
const css = fs.readFileSync("design-competition.css", "utf8");
const js = fs.readFileSync("design-competition.js", "utf8");

assert.equal((html.match(/data-theme-target=/g)||[]).length,3,"three design entries");
for(const theme of ["signage","boardgame","night"]){
  assert.match(html,new RegExp(`data-theme-target=["']${theme}["']`));
  assert.match(css,new RegExp(`data-theme=[\\"']${theme}[\\"']`));
  assert.match(js,new RegExp(`${theme}:`));
}
for(const id of ["prototype","conceptName","entryLetter","conceptTitle","conceptDescription","conceptTags","voteButton","voteResult","voteResultText","clearVoteButton"]){
  assert.match(html,new RegExp(`id=["']${id}["']`),`#${id} exists`);
}
assert.match(html,/LocalStorage/);
assert.match(html,/design-competition\.js/);
assert.match(html,/design-competition\.css/);
assert.doesNotMatch(html,/<script[^>]+src=["']https?:/i,"no external script dependency");

console.log("Design competition tests passed.");
