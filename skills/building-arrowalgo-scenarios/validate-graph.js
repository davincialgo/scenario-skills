#!/usr/bin/env node
"use strict";
// Validate an ArrowAlgo scenario graph before create_scenario / update_scenario.
//
//   node validate-graph.js graph.json              -> errors + warnings, exit 1 on errors
//   node validate-graph.js stored.json --to-submit  -> print the graph converted to submit format
//
// Accepts a bare graph ({nodes}), a wrapper ({graph:{nodes}}), or a get_scenario
// response ({data:{nodes, links}}). Plain Node, no dependencies.

const fs = require("fs");

const SPECIAL = {
  "indicator/PositionStatus": "PositionStatus",
  "indicator/Latch": "Latch",
  "indicator/TrailingStop": "TrailingStop",
  "indicator/JAVASCRIPT": "JAVASCRIPT",
};

function expectedService(type) {
  if (SPECIAL[type]) return [SPECIAL[type]];
  if (type.startsWith("Data Watcher/")) return [type.slice("Data Watcher/".length)];
  if (type.startsWith("math/")) return ["math"];
  if (type.startsWith("Action/")) return [type.slice("Action/".length)];
  if (type === "indicator/sma") return ["indicator", "SMA"];
  if (type.startsWith("indicator/")) return ["indicator"];
  return null;
}

function unwrap(doc) {
  if (doc?.nodes) return doc;
  if (doc?.graph?.nodes) return doc.graph;
  if (doc?.data?.nodes) return doc.data;
  throw new Error("No nodes found (expected {nodes}, {graph:{nodes}} or {data:{nodes}})");
}

// Stored (LiteGraph) format uses link ids + a links array; submit format uses source node ids.
function toSubmitFormat(graph) {
  if (!Array.isArray(graph.links) || !graph.links.length) return graph;
  const links = new Map(graph.links.map((l) => [l[0], l]));
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      inputs: (node.inputs || []).map((input) => {
        if (input.link == null) return input;
        const link = links.get(input.link);
        if (!link) throw new Error(`Node ${node.id} input ${input.name} references missing link ${input.link}`);
        return { ...input, link: link[1], slot_index: link[2] };
      }),
      outputs: (node.outputs || []).map((output) => ({ ...output, links: [] })),
    })),
  };
}

function validate(graph) {
  const errors = [], warnings = [];
  const nodes = new Map();
  for (const node of graph.nodes) {
    if (!Number.isInteger(node.id)) errors.push(`Node with non-integer id: ${JSON.stringify(node.id)}`);
    else if (nodes.has(node.id)) errors.push(`Duplicate node id ${node.id}`);
    nodes.set(node.id, node);
  }

  const pairs = new Set([...nodes.values()].map((n) => n.properties?.Pair).filter(Boolean));
  const multiPair = pairs.size > 1;
  const edges = new Map();
  const consumers = new Map(); // "src:slot" -> [{node, input}]
  for (const node of nodes.values()) {
    const where = `node ${node.id} (${node.type})`;
    const expected = expectedService(node.type);
    if (!node.serviceName) warnings.push(`${where}: no serviceName (expected ${expected?.join(" or ") ?? "?"})`);
    else if (expected && !expected.includes(node.serviceName))
      errors.push(`${where}: serviceName "${node.serviceName}" should be ${expected.join(" or ")}`);

    for (const input of node.inputs || []) {
      if (input.link == null) continue;
      const src = nodes.get(input.link), slot = input.slot_index ?? 0;
      if (!src) { errors.push(`${where}: input ${input.name} links to missing node ${input.link}`); continue; }
      if (src.id === node.id) errors.push(`${where}: input ${input.name} links to itself`);
      if (Array.isArray(src.outputs) && src.outputs.length && !src.outputs[slot]) errors.push(`${where}: input ${input.name} uses slot ${slot}, but node ${src.id} has ${src.outputs?.length ?? 0} outputs`);
      edges.set(node.id, [...(edges.get(node.id) || []), src.id]);
      const key = `${src.id}:${slot}`;
      consumers.set(key, [...(consumers.get(key) || []), { node, input }]);
    }

    const props = node.properties || {};
    if (typeof props.Pair === "string" && props.Pair.includes("/")) errors.push(`${where}: Pair "${props.Pair}" must use dashes, not slashes`);

    if (node.type === "math/condition") {
      const connected = (node.inputs || []).filter((i) => i.link != null).length;
      if (connected < 2) errors.push(`${where}: condition has ${connected} connected input(s); needs at least 2`);
      if (props.Inputs != null && Number(props.Inputs) !== (node.inputs || []).length)
        warnings.push(`${where}: Inputs=${props.Inputs} but ${(node.inputs || []).length} inputs are declared`);
    }
    if ((node.type === "indicator/PositionStatus" || node.type === "indicator/last_profit") && (!props.Exchange || !props.Pair))
      (multiPair ? errors : warnings).push(`${where}: set Exchange and Pair explicitly (if scope can't be resolved, PositionStatus emits zeros)`);
    if (node.type.startsWith("Action/")) {
      const trigger = (node.inputs || []).find((i) => i.name === "Trigger");
      if (!trigger || trigger.link == null) errors.push(`${where}: action has no connected Trigger`);
      else {
        const src = nodes.get(trigger.link);
        if (src?.type === "math/condition" && (trigger.slot_index ?? 0) === 2)
          warnings.push(`${where}: Trigger is wired to a condition's result slot (2), which fires every candle including 0. Use true (0)`);
      }
      if (/From Input/.test(props["Amount as"] || "") && !(node.inputs || []).some((i) => i.name === "Amount" && i.link != null))
        errors.push(`${where}: "Amount as: ${props["Amount as"]}" needs a connected Amount input`);
      if (props["Order Type"] === "Limit" && !(node.inputs || []).some((i) => i.name === "price" && i.link != null))
        errors.push(`${where}: Limit order needs a connected price input`);
    }
  }

  // TrailingStop has only slots 0/1.
  for (const [key, list] of consumers) {
    const [id, slot] = key.split(":").map(Number);
    if (nodes.get(id)?.type === "indicator/TrailingStop" && slot > 1)
      for (const c of list) errors.push(`node ${c.node.id}: uses TrailingStop ${id} slot ${slot}; only 0/1 exist (zero results, no error)`);
  }

  // Variables: every reader (no connected input) needs a writer with the same block_name.
  const writers = new Set(), readers = [];
  for (const node of nodes.values()) {
    if (node.type !== "math/variable") continue;
    const name = node.properties?.block_name;
    if ((node.inputs || []).some((i) => i.link != null)) writers.add(name);
    else readers.push(node);
  }
  for (const r of readers) if (!writers.has(r.properties?.block_name))
    errors.push(`node ${r.id}: variable reader "${r.properties?.block_name}" has no writer`);

  // Every FUTURE_OPEN needs a FUTURE_CLOSE on the same pair and side.
  const actions = [...nodes.values()].filter((n) => /^Action\/FUTURE_(OPEN|CLOSE)$/.test(n.type));
  for (const open of actions.filter((n) => n.type === "Action/FUTURE_OPEN")) {
    const p = open.properties || {};
    const hasClose = actions.some((c) => c.type === "Action/FUTURE_CLOSE" && c.properties?.Pair === p.Pair && c.properties?.["Position Type"] === p["Position Type"]);
    if (!hasClose) warnings.push(`node ${open.id}: FUTURE_OPEN ${p.Pair} ${p["Position Type"]} has no matching FUTURE_CLOSE`);
  }

  // Cycles (e.g. stale inputs left after removing nodes).
  const state = new Map();
  const visit = (id, path) => {
    if (state.get(id) === 1) { errors.push(`Dependency cycle: ${[...path, id].join(" -> ")}`); return; }
    if (state.get(id) === 2) return;
    state.set(id, 1);
    for (const src of edges.get(id) || []) visit(src, [...path, id]);
    state.set(id, 2);
  };
  for (const id of nodes.keys()) visit(id, []);

  // Dead ends: nodes whose outputs feed nothing (except actions).
  const used = new Set([...consumers.keys()].map((k) => Number(k.split(":")[0])));
  for (const node of nodes.values())
    if (!node.type.startsWith("Action/") && !used.has(node.id) && !(node.type === "math/variable" && (node.inputs || []).some((i) => i.link != null)))
      warnings.push(`node ${node.id} (${node.type}): output is not used by anything`);

  if (!actions.length && ![...nodes.values()].some((n) => /^Action\//.test(n.type))) errors.push("Graph has no action block");
  return { errors, warnings };
}

if (require.main === module) {
  const [file, flag] = process.argv.slice(2);
  if (!file) { console.error("usage: node validate-graph.js <graph.json> [--to-submit]"); process.exit(2); }
  const raw = unwrap(JSON.parse(fs.readFileSync(file, "utf8")));
  const stored = Array.isArray(raw.links) && raw.links.length > 0;
  const graph = toSubmitFormat(raw);
  if (flag === "--to-submit") { process.stdout.write(JSON.stringify(graph, null, 1) + "\n"); process.exit(0); }
  const { errors, warnings } = validate(graph);
  if (stored) console.log("note: stored (get_scenario) format detected; validated after converting to submit format. Use --to-submit before resubmitting.");
  for (const w of warnings) console.log("warning:", w);
  for (const e of errors) console.log("ERROR:", e);
  console.log(`${graph.nodes.length} nodes, ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(errors.length ? 1 : 0);
}

module.exports = { validate, toSubmitFormat, expectedService };
