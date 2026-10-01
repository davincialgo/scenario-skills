# Triage: Is It My Graph or the Platform?

Work through the steps in order, and stop at the first explanation you find.

1. **Status.** Is the run actually status 3? A status 0 run needs its `failureReason`; a 1 or 2 is still running. A run that shows 3 in an old manifest but 0 now has failed.
2. **Provenance.** Was the stored number really produced by the campaign it is filed under? Backtest ids are time-ordered hex, so a June id prefix inside an August campaign means the row was never re-run. A whole "the ADX indicator changed" diagnosis was retracted for exactly this reason.
3. **Sibling control.** If a shared component is the suspect, run sibling scenarios that use that same component. A change to the shared component must move every one of them; if the siblings reproduce to 4 decimal places, the component is fine. Watch for **selection artefacts**: "all new entries now pass the ADX bar" can simply mean the new run trades less.
4. **Warmup.** A `warmupHours` of `null` or `0`, or a first order more than 7 days after the start, means the run started cold.
5. **Graph structure.** Use the graph returned by `get_scenario`, not your local copy, and check:
   - every node has the right `serviceName`;
   - no input points at a missing node or slot;
   - no stale inputs were left behind after nodes were removed;
   - there are no cycles;
   - each input is wired to the intended output slot;
   - there are no leftover static properties (for example `Amount` alongside `Amount as: From Input`).
6. **Graph behaviour.** Does each gate ever change state? Read debug frames at the bar where you expected an action, and compare signals with orders.
7. **Concurrency.** Was this run part of a large batch? Re-run it alone. If the solo result differs, the cause is load, not your graph.
8. **Candles.** Use `get_candles` with an explicit `limit`, and include some margin on both sides of the window. Check for:
   - OHLC invariants: `low <= min(o,c) <= max(o,c) <= high`;
   - spikes: `high > 1.25×max(o,c)` or `low < 0.75×min(o,c)`;
   - sentinel values: identical OHLC, or zero volume;
   - gaps around split dates (look at the `adjustment` field);
   - a daily high that doesn't match the highest intraday high for that session.
9. **Intentional engine change.** The engine sometimes corrects an indicator on purpose (for example, ADX moved to full-history recursion). A new number from a corrected indicator is not a reproducibility bug, but every result from before the change is stale.
10. **Isolate.** Build a 4–10-node smoke scenario that reproduces the problem on a 1–3 week window. Also compare against a logically equivalent rebuilt graph. If only your strategy graph reproduces the problem and the smoke does not, call it **suspected**, not confirmed. Classify it as provider-, indicator-, action- or tool-specific.

Keep one canonical smoke for each mechanic you rely on (limit replace, PositionStatus timing, multi-pair scoping, spot accounting). Re-run them whenever results look odd or a fix lands.

## Bug report template

```markdown
# ArrowAlgo issue: <one-line symptom>
Date: <date>   Tools: run_backtest / get_backtest_results / ...
Scope: provider, pair, interval, action type, block type

## Summary
Expected vs actual, and why it matters (e.g. "indistinguishable from a legit 0% result").

## Minimal reproduction
- Smoke scenario: <node list>, scenario id
- Exact run_backtest args (JSON)
- Failing backtest ids + control backtest ids

## Evidence
| Backtest | Context | status | signals | orders | return | key field |
Raw values (failureReason, warmupHours, orders with created_on/cancel_time, debug frame at bar X).
An independent recomputation from orders + candles if a metric is disputed.

## Ruled out on our side
- Graph from get_scenario inspected: service names, links, no cycles, no stale inputs
- Control / equivalent rebuilt graph behaves <same|differently>
- Status 3, warmup present, not a concurrent batch, id provenance checked

## Classification
Provider / indicator / action / tool-only. Confirmed or suspected.

## Impact
What is paused until it is fixed.

## Verification when fixed
Exact re-run (same scenario + window) and the pass criterion.
```

When a fix lands, re-run the same reproduction and add a `RESOLVED <date>` section to the original report rather than deleting it. Mark every result produced before the fix as stale until it has been re-run.
