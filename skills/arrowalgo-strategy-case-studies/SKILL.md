---
name: arrowalgo-strategy-case-studies
description: Use when designing a new ArrowAlgo strategy or picking a starting template (BTC trend following, pyramiding, SMA regime filters, VWAP mean reversion, support or limit entries, shorts, leverage, stops), when wondering whether an idea has already been tried, or when someone proposes stops, take-profits, filters or limit entries to improve a strategy.
---

# ArrowAlgo Strategy Case Studies

## Overview

This is a record of 13 strategy families researched on ArrowAlgo between April and September 2026. It lists what survived, what failed, and why. **Check here before building an idea from scratch**: most "obvious improvements" were already tested against a frozen rule and failed. Full write-ups are in [case-studies.md](case-studies.md), and the graphs you can import are in [examples/](examples/README.md).

## What survived

| Strategy | Result (current engine, audited) | Caveat |
|---|---|---|
| **V85-3x ADX20**: BTC 4h breakout trend with pyramiding adds, daily SMA50 macro gate | 24/25 rolling 12-month windows positive, worst −15.9%, median/mean 0.80. It passes every consistency gate. Holdout +48% | A survivor of a 5-variant family search. Live returns are expected at about 1/5 of in-sample |
| **V85-5x ADX20**: the same strategy at 5x | 2022–24 +1,026%, 2025–26-09 +51.7%, 2018–21 +97.5% (BTC +530% over 2018–21) | Fails the median/mean and worst-window gates. Had a 68% drawdown in 2018–21 |
| **V80** (5x, 15% adds, ADX30) | Unseen 2026-04..09: +25.2% vs BTC +12.5%. It stayed flat through a −28.7% crash | 2 of 5 calendar years were losses. In the market only about 10% of the time |
| **SMA200 regime** (1x) | The simplest baseline. Every trend idea must beat it | — |

## What failed

| Idea | Why it failed |
|---|---|
| Stops (2–5%, break-even), partial take-profit, add caps, "don't buy near the high" | Each one helped one period and hurt the other. Winners and give-back losers look identical early. |
| Resting limit buys at support (live55-s5) | Adverse selection: a market entry at the same levels won in 10 of 12 comparisons. Walk-forward IS +83% vs OOS +8%. |
| QQQ 15m VWAP reversion "J" | +27.7% in one year, but over 18 quarters +55% vs QQQ hold +116%. The "fixed" switch version used the wrong daily close. |
| BTC SMA50-in / SMA200-out | No state guard: it churned daily between the lines, which made a grid that passed 8/8 meaningless. |
| C16 OrderBlock | Overfit warnings, parameters drifted 20→10, and the ranking flipped once runs used the current engine. |
| CCI washout, sector breadth, ten-asset rules, mega-cap timing overlay | Each lost to its own simplest control or to buy-and-hold. The overlays are crash insurance, not alpha. |
| Small-profit / day-trading exits, 1h RSI dips | A 72% win rate with a loss tail that dominates. |
| arXiv replications (TSMOM, pairs, speed selectors) | The paper's preconditions (for example, cointegration) didn't hold on the actual data. |

## Lessons that carry across strategies

1. **Trend followers earn from a few tails.** For V80, the top 3 positions were more than 100% of gross PnL. Anything that cuts tails, such as stops, pauses or tighter exits, kills the edge.
2. **The loss source is give-back, not late entry.** Winners and losers enter equally late, and give-back can't be exited away without losing the winners too.
3. **Leverage dominates the headline numbers.** Pick the leverage for the drawdown you can live with; never pick it from a backtest ranking. 9x lost 99.99% on one position.
4. **Short horizons are a coin flip.** V85-5x was negative in about 55% of 7–30-day starts. Tell users before they go live.
5. **Pair every limit-entry idea with a market-entry twin,** and check live exchange filters, because the backtest fills orders the exchange would reject.
6. **Build the simplest control first** (an SMA200 in/out on the same asset), and require the new idea to beat it.

## Using the examples

```js
const f = require("./examples/sma200-regime.json");
create_scenario({ name: f.name, graph: f.graph, warmup: f.warmupHours });
```

Before quoting any number, re-run on the current engine following the `running-arrowalgo-backtests` and `validating-trading-strategies` skills. Files under `examples/unverified/` were rebuilt from written specs and have **not** been round-trip tested; each one has a `verifyAgainst` block with the numbers it should reproduce.
