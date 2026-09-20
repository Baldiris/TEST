const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("app.js", "utf8");
const boundary = source.indexOf("const KEY=");
assert.ok(boundary > 0, "pure game logic boundary was not found");

const logic = source.slice(0, boundary);
const tests = `
assert.equal(ALL_STATIONS.length, 138, "station count");

const visited = new Set([ALL_STATIONS[0]]);
const queue = [ALL_STATIONS[0]];
for (let i = 0; i < queue.length; i++) {
  for (const edge of GRAPH[queue[i]]) {
    if (!visited.has(edge.to)) {
      visited.add(edge.to);
      queue.push(edge.to);
    }
  }
}
assert.equal(visited.size, ALL_STATIONS.length, "all stations must be connected");

for (const [from, edges] of Object.entries(GRAPH)) {
  for (const edge of edges) {
    assert.ok(
      GRAPH[edge.to].some(reverse => reverse.to === from && reverse.line === edge.line),
      from + " -> " + edge.to + " must have a reverse edge"
    );
  }
}

assert.equal(shortest("木場", "三越前").distance, 4, "known cross-line route");
assert.equal(
  shortest("青山一丁目", "桜田門").distance,
  2,
  "transfer must cost zero spaces"
);

const sixAway = reachableExactly("木場", 6);
assert.equal(sixAway.size, 12, "known exact six-space candidate count");
for (const [station, route] of sixAway) {
  assert.equal(route.distance, 6, station + " must be exactly six spaces away");
}

for (const [a, b] of [["浅草", "渋谷"], ["荻窪", "西船橋"], ["目黒", "北綾瀬"]]) {
  assert.equal(shortest(a, b).distance, shortest(b, a).distance, a + " route symmetry");
}
`;

vm.runInNewContext(logic + tests, {assert, console});
console.log("Game logic tests passed.");
