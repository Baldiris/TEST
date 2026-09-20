const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("index.html", "utf8");
const source = fs.readFileSync("app.js", "utf8");
const elementIds = [...html.matchAll(/id=["']([^"']+)["']/g)].map(match => match[1]);

class ClassList {
  constructor(classes = "") { this.values = new Set(classes.split(/\s+/).filter(Boolean)); }
  add(...names) { names.forEach(name => this.values.add(name)); }
  remove(...names) { names.forEach(name => this.values.delete(name)); }
  toggle(name, force) {
    if (force === undefined) force = !this.values.has(name);
    force ? this.values.add(name) : this.values.delete(name);
    return force;
  }
  contains(name) { return this.values.has(name); }
}

class ElementStub {
  constructor(id = "", classes = "") {
    this.id = id;
    this.classList = new ClassList(classes);
    this.style = {};
    this.children = [];
    this.attributes = {};
    this.innerHTML = "";
    this.textContent = "";
    this.disabled = false;
    this.clientWidth = 360;
    this.clientHeight = 420;
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener() {}
  scrollTo() {}
  scrollIntoView() {}
}

const elements = new Map(elementIds.map(id => {
  const classMatch = html.match(new RegExp(`<[^>]+class=["']([^"']*)["'][^>]+id=["']${id}["']|<[^>]+id=["']${id}["'][^>]+class=["']([^"']*)["']`));
  return [id, new ElementStub(id, classMatch ? (classMatch[1] || classMatch[2] || "") : "")];
}));

const storage = new Map([
  ["kimagureMetroTripV04", JSON.stringify({version:"0.4", phase:"home", history:["legacy"]})]
]);
const documentStub = {
  getElementById(id) { return elements.get(id); },
  createElementNS() { return new ElementStub(); },
  querySelectorAll() { return []; }
};
const localStorageStub = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};

const smoke = `
assert.equal(state.version, "0.5", "V0.4 save data migrates to V0.5");
assert.deepEqual(state.history, ["legacy"]);

setupStart = "木場";
setupGoal = "三越前";
confirmSetup();
assert.equal(state.phase, "game");
assert.equal(state.current, "木場");
assert.equal($("remainStat").textContent, 4);

state.dice = 6;
state.reachable = Object.fromEntries(reachableExactly(state.current, state.dice));
state.reachable[state.goal] = shortest(state.current, state.goal);
renderGame();
assert.match($("candidateList").innerHTML, /三越前/);
assert.match($("candidateList").innerHTML, /GOAL/);
assert.equal($("rollBtn").disabled, true, "reroll is disabled after the roll is fixed");

chooseTarget("三越前");
assert.equal(state.phase, "arrival");
arrive();
assert.equal(state.phase, "quests");
assert.equal(state.current, "三越前");
assert.equal(state.quests["三越前"].length, 2);

nextTurn();
assert.equal(state.phase, "finished");
assert.equal(state.finished, true);
`;

const context = {
  assert,
  console,
  document: documentStub,
  localStorage: localStorageStub,
  window: {scrollTo() {}, matchMedia() { return {matches:true}; }},
  confirm: () => true,
  requestAnimationFrame: callback => callback(),
  setTimeout: callback => { callback(); return 1; },
  clearTimeout() {},
  setInterval() { throw new Error("unexpected interval in smoke test"); },
  clearInterval() {}
};

vm.runInNewContext(source + smoke, context);
console.log("Runtime smoke test passed.");
