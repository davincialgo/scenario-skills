---
name: running-arrowalgo-backtests
description: Use when launching or reading ArrowAlgo backtests or walk-forwards through MCP (run_backtest, get_backtest_results, get_backtest_orders, run_walkforward), when a backtest returns 0 orders, 0%, status 0/1/2, a 504, or a number that won't reproduce, or when deciding whether a problem is your graph or an ArrowAlgo platform bug.
---

# Running ArrowAlgo Backtests

## Overview

The backtest engine is mostly right. **Your bookkeeping usually isn't.** Most "the engine changed" or "the engine is broken" reports turned out to be one of the following: a run read before it finished, a stored number that was never re-run, a concurrent-launch artefact, or a graph bug. Read results defensively, and rule out your own side before you file a platform bug.

## Status codes

| status | Meaning | Treat as |
|---|---|---|
| `0` | Terminal failure. Read `failureReason` / `message` (`error` may be null). | A failure, **never** a 0% result |
| `1`, `2` | Queued or running. Zero signals at this stage mean nothing. | Not a result |
| `3` / `"finished"` | Complete | The only state you can score |

## Launch rules

1. **Run at most about 2 backtests at once, and include a control.** Large simultaneous launches have produced timeouts *and* runs that report status 3 with 0 orders and 0% (the same run made +196% when launched alone). Start each campaign with an unchanged scenario on a window with a known result. If that control shows 0 orders, the whole batch is void.
2. **Never auto-retry `run_backtest`, `create_scenario`, `clone_scenario` or `update_scenario`.** A 504 can still have created the backtest. Record what you meant to launch before the call. On a timeout, look up the run with `list_backtests` (exact scenario, start date and end date) before relaunching.
3. **Run parameter sweeps by cloning.** `run_backtest` `optimize` has returned a groupId without ever spawning children. Use `clone_scenario`, then `update_scenario`, then `run_backtest` for each variant. `run_walkforward` does spawn its children.
4. **Snapshot the graph and a hash of it with every campaign.** Scenarios are mutable. Re-hash before each launch, and abort if the graph changed.
5. **Pass `warmup` on create, and use `saveLogs: true`** whenever you may need debug frames.

## Reading results

- **Gate on `warmupHours`.** A value of `0` or `null` means a cold start: the run silently skipped early signals and any losses in them.
- Use `markToMarketReturn` with `performanceBasis`. Use `annualizedReturn` only when `annualizedReturnVersion` is present (a simple, non-compounded MTM %). Unversioned legacy values are currency-scaled, so re-run those backtests. If a run ends with an open position, extend the window or report realized and MTM side by side.
- **Page through `get_backtest_orders`** (`format:"full"`, `limit`/`offset`) until the row count equals `total`. Summary rows drop `leverage`.
- Pass an explicit `limit` to `get_candles`. The default of 100 bars silently truncates long windows. Fail if the count you get back equals the cap.
- A finished run with no trades can omit its return fields. Report 0% only when the final balance equals the start balance.
- Walk-forward:
  - The results call takes `{groupId}`.
  - Check `completedWindows` against `totalWindows` and read `warning`.
  - Confirm each child's actual dates.
  - **Never rank on `overfitScore`.** It compares raw returns over windows of different lengths and tracks leverage.

## Why didn't it trade on bar X?

1. Run a short window with `saveLogs:true`.
2. Call `get_backtest_debug_times`, then `get_backtest_debug_at_time` at that bar. The response shows each node's inputs.
3. Compare `get_backtest_signals` with the orders. If there was no signal, the problem is in the logic. If there was a signal but no order, look at the action, sizing or funding.

## Graph or platform?

Work through [triage-and-bug-reports.md](triage-and-bug-reports.md) in order, and stop at the first explanation:

1. Status
2. Provenance (was this row actually re-run?)
3. Sibling control
4. Warmup
5. Graph structure
6. Graph behaviour
7. Solo rerun
8. Candle sanity
9. Intentional engine change
10. Minimal smoke

A suspected platform bug only goes into a report after steps 1–9 are ruled out. Once a platform bug is confirmed, **stop tuning the strategy around it**, and report it with the template in that file.

[platform-status.md](platform-status.md) lists the known open platform issues and their workarounds.
