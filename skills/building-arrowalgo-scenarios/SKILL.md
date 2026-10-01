---
name: building-arrowalgo-scenarios
description: Use when creating, editing, cloning or debugging an ArrowAlgo scenario graph (nodes, links, conditions, PositionStatus, Latch, variables, FUTURE_OPEN/FUTURE_CLOSE, BUY/SELL, limit orders, JavaScript blocks) via create_scenario or update_scenario, or when the validator rejects a graph, a backtest trades zero times, or entries and exits fire on alternating bars.
---

# Building ArrowAlgo Scenarios

## Overview

An ArrowAlgo scenario is a node graph: watchers emit candles, indicators and `math/*` blocks transform them, conditions emit pulses, and action blocks place orders. Most "strategy results" that looked wrong turned out to be **graph bugs**, not market behaviour or engine bugs. Build small, validate locally, and prove every branch actually fires.

For the live block catalogue, call the MCP tool `get_skills` (block-types, scenario-construction, validation-rules). This skill records what those docs don't say, or what we learned the hard way. Exact field names are in [graph-reference.md](graph-reference.md); exchange differences are in [provider-quirks.md](provider-quirks.md).

## The two graph formats (most common breakage)

| | Submit format (`create_scenario`, `update_scenario`) | Stored format (`get_scenario`) |
|---|---|---|
| `inputs[].link` | **source node id** | link id |
| `inputs[].slot_index` | source output slot | not trustworthy |
| `links` array | none | `[linkId, srcNode, srcSlot, dstNode, dstSlot, type]` |

Never resubmit a fetched graph unconverted. For each input, set `link = links[link][1]` and `slot_index = links[link][2]`, clear `outputs[].links`, and drop `links`. For edits, fetch the whole graph, change it locally, and submit the complete graph. To make a variant, clone the scenario rather than patching it in place.

## Wiring rules

1. **Conditions:** `math/condition` has outputs `true` (0) and `false` (1), which are pulses, and `result` (2), which emits 0/1 every candle. Drive actions from the final condition's **`true`** slot (0). When ANDing conditions that update on the same candle (same watcher and interval), feeding their `true` pulses into the AND works. When the inputs come from different timeframes, or you need a level that holds on quiet bars, feed the AND/OR from **`result`** (2) instead.
2. **Never wire a 0/1 level straight into an action `Trigger`.** Actions fire on any defined input, including 0. Always route the level through a condition.
3. **Every condition needs ≥2 connected inputs.** Name them `A`, `B`, `C`…, and when there are more than 2, set `Inputs` to the count. A 1-input `&&` waits forever.
4. **Passive nodes never trigger anything.** `math/fix_number`, variable readers and dynamic `Amount` inputs don't fire on their own. A condition with only passive inputs never evaluates. Watchers, indicators and `PositionStatus` (driven by its `price` watcher) emit every candle, so they are safe to use as condition inputs.
5. **One state must drive both entry and exit.** Independent `close>SMA50 → OPEN` and `close<SMA200 → CLOSE` both fire whenever price sits between the lines, so the position flips every bar. To prevent this, gate the entry with `PositionStatus.in_position == 0` and with the exact complement of the exit condition (exit `close < SMA200`, entry needs `close >= SMA200`). Feed these level checks into the AND from their `result` slots.
6. **Omit `serviceName`.** The backend derives it from `type`. A wrong value on most blocks is kept and misroutes the block, causing silent time-limit failures. If you edit a fetched graph that already has one, make sure it is correct.
7. **Set `Exchange` and `Pair` on every `PositionStatus` / `last_profit` block,** one block per traded pair. The engine infers the scope from the watcher feeding `price`. When it can't, PositionStatus emits zeros, so an `in_position == 0` gate can open a duplicate position.
8. **Pairs use a dash only** (`BTC-USDT`, `XYZ-GOLD-USDC`, `SPY-USD`). Watchers on different pairs must share one interval.
9. **To pyramid or add to a position,** set `Repeat order…: Yes` **and** `Max Repeat Orders: 0`. Note that `% of account` sizes on *free* balance, so repeated adds shrink geometrically.
10. **Exit level strictly below a limit-entry level,** or a fill trips the exit on the next close.

## Before every submit: local validation

Run `node validate-graph.js graph.json`. It needs no dependencies and is bundled with this skill. It accepts `{nodes}`, `{graph:{nodes}}` or a `get_scenario` response. To convert a fetched graph back to submit format, run `node validate-graph.js stored.json --to-submit`. The script checks:
- unique node ids;
- every `link` points to an existing node, and `slot_index` is less than that node's output count;
- no self-links and no cycles;
- removed nodes have no remaining consumers (stale inputs left on AND/OR aggregators create cycles, which the validator rejects);
- every variable reader has a writer with the same `block_name`;
- every `FUTURE_OPEN` has a matching `FUTURE_CLOSE`.

**If the validator rejects a graph your script built, assume your generator is wrong first.**

## After submit: prove it behaves

- Run a 2–4 week smoke backtest with `saveLogs: true`.
- If a variant's result is **identical** to its parent's, the new branch is dead. Check that it can become true and that it reaches the action.
- Use `get_backtest_debug_at_time` on the bar where you expected an action. It shows node **inputs**, so read a node's value at its consumer.
- Check the gate's duty cycle. A gate that is on 100% (or 0%) of days is not a gate.

## Common patterns

- **Cross-timeframe state:** a daily condition's `result` goes to a `math/variable` writer, which a reader in the 4h graph picks up. Expect a one-candle propagation delay. Don't feed a 1d Latch into a 15m AND: it only emits at the daily boundary.
- **Remembered level without Latch:** a variable reader holds the old value; `math/gate(cond.result, newValue, old)` produces the live level, and a variable writer stores it for the next bar.
- **Latch:** condition `true` (0) goes to SET and condition `false` (1) goes to RESET. A 0 on RESET does nothing.
- **Moving a resting limit:** fire the open every bar with `Cancel open orders only`. There is no cancel-only action, and a `FUTURE_CLOSE` while flat does not cancel resting orders.
- **Complex math:** `indicator/JAVASCRIPT` works (it is stateless, takes 1–10 inputs, and returns `{as_of, ready, outputs}`). There is no Python block.

## Starting points

Example graphs to clone are in the `arrowalgo-strategy-case-studies` skill's `examples/` folder. The smallest correct trend template is `sma200-regime.json`. `btc-out200-ORIGINAL-churns.json` shows rule 5 being broken.
