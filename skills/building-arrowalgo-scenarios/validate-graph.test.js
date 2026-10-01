"use strict";
// node --test validate-graph.test.js
const test = require("node:test");
const assert = require("node:assert");
const { validate, toSubmitFormat } = require("./validate-graph");

const out = (...names) => names.map((name, slot_index) => ({ name, type: "number", links: [], slot_index }));
const watcher = (id, pair = "BTC-USDT") => ({ id, type: "Data Watcher/Binance", serviceName: "Binance", inputs: [], outputs: out("close"), properties: { Pair: pair, Interval: "1d", Output: "close" } });
const sma = (id, src) => ({ id, type: "indicator/sma", serviceName: "indicator", inputs: [{ name: "in", link: src, slot_index: 0 }], outputs: out("out"), properties: { time_period: 50 } });
const cond = (id, a, b, op = ">") => ({ id, type: "math/condition", serviceName: "math", inputs: [{ name: "A", link: a, slot_index: 0 }, { name: "B", link: b, slot_index: 0 }].filter((i) => i.link != null), outputs: out("true", "false", "result"), properties: { OP: op } });
const action = (id, type, trigger, slot = 0) => ({ id, type: `Action/${type}`, serviceName: type, inputs: [{ name: "Trigger", link: trigger, slot_index: slot }], outputs: [], properties: { Exchange: "Binance", Pair: "BTC-USDT", "Position Type": "Long", "Order Type": "Market", Amount: 95, "Amount as": "% of account" } });
const base = () => [watcher(1), sma(2, 1), cond(3, 1, 2, ">"), cond(4, 1, 2, "<"), action(5, "FUTURE_OPEN", 3), action(6, "FUTURE_CLOSE", 4)];
const errorsOf = (nodes) => validate({ nodes }).errors.join("\n");

test("clean graph passes", () => assert.strictEqual(errorsOf(base()), ""));

test("stale input forming a cycle is caught", () => {
  const nodes = base();
  nodes[2].inputs[1].link = 4; // 3 <- 4
  nodes[3].inputs[1].link = 3; // 4 <- 3
  assert.match(errorsOf(nodes), /Dependency cycle/);
});

test("input pointing at removed node is caught", () => {
  const nodes = base().filter((n) => n.id !== 2);
  assert.match(errorsOf(nodes), /missing node 2/);
});

test("Latch with serviceName indicator is caught", () => {
  const nodes = [...base(), { id: 7, type: "indicator/Latch", serviceName: "indicator", inputs: [{ name: "SET", link: 3, slot_index: 0 }, { name: "RESET", link: 4, slot_index: 1 }], outputs: out("value"), properties: {} }];
  assert.match(errorsOf(nodes), /serviceName "indicator" should be Latch/);
});

test("slash pair is caught", () => {
  const nodes = base();
  nodes[0].properties.Pair = "BTC/USDT";
  assert.match(errorsOf(nodes), /dashes/);
});

test("single-input condition is caught", () => {
  const nodes = base();
  nodes[2] = cond(3, 1, null);
  assert.match(errorsOf(nodes), /needs at least 2/);
});

test("variable reader without writer is caught", () => {
  const nodes = [...base(), { id: 8, type: "math/variable", serviceName: "math", inputs: [], outputs: out("value"), properties: { block_name: "macro_bull" } }];
  assert.match(errorsOf(nodes), /no writer/);
});

test("action on result slot warns", () => {
  const nodes = base();
  nodes[4] = action(5, "FUTURE_OPEN", 3, 2);
  assert.match(validate({ nodes }).warnings.join("\n"), /result slot/);
});

test("unscoped PositionStatus is an error only in multi-pair graphs", () => {
  const ps = { id: 9, type: "indicator/PositionStatus", serviceName: "PositionStatus", inputs: [{ name: "price", link: 1, slot_index: 0 }], outputs: out("in_position", "entry_price", "unrealized_pnl%", "candles_in_position", "direction"), properties: {} };
  assert.strictEqual(errorsOf([...base(), ps]), "");
  assert.match(errorsOf([...base(), ps, watcher(10, "ETH-USDT")]), /Exchange and Pair/);
});

test("stored format converts link ids to source node ids", () => {
  const stored = {
    nodes: [
      { id: 1, type: "Data Watcher/Binance", serviceName: "Binance", inputs: [], outputs: [{ name: "close", links: [7] }], properties: { Pair: "BTC-USDT" } },
      { id: 2, type: "indicator/sma", serviceName: "indicator", inputs: [{ name: "in", link: 7, slot_index: 0 }], outputs: [{ name: "out", links: [] }], properties: {} },
    ],
    links: [[7, 1, 0, 2, 0, null]],
  };
  const g = toSubmitFormat(stored);
  assert.strictEqual(g.links, undefined);
  assert.deepStrictEqual(g.nodes[1].inputs[0], { name: "in", link: 1, slot_index: 0 });
  assert.deepStrictEqual(g.nodes[0].outputs[0].links, []);
});
