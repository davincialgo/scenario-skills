---
name: validating-trading-strategies
description: Use when judging whether a trading strategy or ArrowAlgo scenario is good, comparing variants, picking parameters, reporting backtest returns to someone, deciding to go live, or when a result looks great, beats buy-and-hold, or comes from one window, one year, one asset, or a leveraged run.
---

# Validating Trading Strategies

## Overview

**Make the number survive before you believe it.** Across about 1,200 replays and hundreds of platform backtests, most headline numbers did not survive scrutiny. The causes were cold-start indicators, a truncated benchmark, leverage dropped by the scorer, stale stored rows, resampled closes, a missing state guard, one-year samples and family selection. Here is what happened to three of them:

| Strategy | Claimed | After scrutiny |
|---|---|---|
| QQQ VWAP switch | +151% | +91%, which loses to QQQ hold at +116% |
| V80 out-of-sample | +68.7% | +37.85%, then −13% |
| V85 | +6,750% | +1,026% |

Correctness comes first, statistics second, the story last.

## Quick verdict (when someone wants go/no-go now)

The answer is **no-go for meaningful money** if any of these is true. No amount of urgency changes that.
- The result comes from fewer than ~3 years, or has no falling-market window in it.
- It is the best of N variants on the same data, with no untouched holdout.
- A rule (stop, filter, parameter) was chosen *because* it improved the holdout.
- There is no 1x / unleveraged result, or the costs and funding are unstated.
- The run is not status 3, or not warmed, or the number is unaudited.

If it is a no-go, say exactly which checks would turn it into a go. If they still want to trade it, the ceiling is a paper or small live slice: money they can lose entirely, typically ≤5% of risk capital. Compare the live slice to the backtest for at least 3–6 months before scaling. Treat a short live sample as a coin flip in either direction.

Fields that are easy to misread:
- `totalReturn` is **realized only** while a position is still open.
- `annualizedReturn` is trustworthy only when `annualizedReturnVersion` is present (a simple, non-compounded MTM %). Unversioned legacy values are currency-scaled, so re-run those backtests.
- `profit_usd` on orders is **gross of fees**.
- Use `markToMarketReturn` with `performanceBasis`, or your own ledger audit.

## 1. Is the number real?

- Only status 3 counts. Gate on `warmupHours`: `0` or `null` means the run started cold, so reject it.
- Reject any window that has data warnings, and list the excluded windows.
- **Rebuild equity from the order ledger:** apply fees and the real leverage, mark to market at an independent close, and reconcile to the platform's MTM figure. Don't trust `totalReturn`. `profit_usd` is gross of fees.
- Ended with a position open? Report realized and MTM side by side, then extend the window.
- Re-run every stored baseline on today's engine before comparing anything against it.

## 2. What does it beat?

Report all of these over identical dates and capital:
- **buy-and-hold of the same asset**;
- **SPY/QQQ hold**;
- **BTC hold** for crypto;
- an **exposure-matched or leveraged hold** for anything that is mostly flat or leveraged;
- **the same rule without your new filter** (an ablation).

State the objective before scoring. Absolute and relative objectives disagree. Losing less than a falling asset is drawdown control, not alpha.

## 3. Costs

- Use at least 5 bp fee plus 5 bp slippage per side, and also replay at double cost.
- Add funding for perpetuals.
- For high-turnover strategies, compute the break-even slippage.
- A limit-entry strategy must beat a **market-entry twin on the same levels**. Resting limits suffered adverse selection in 10 of 12 comparisons.

## 4. Out-of-sample discipline

- **Freeze a protocol before reading any result.** It lists the change, the train and holdout dates, the baseline, the selection rule and the decision rule.
- **Pick the plateau, not the peak:** the best mean of a parameter value and its two neighbours, excluding endpoints.
- **The holdout runs once.** A variant must beat the baseline in **both** train and holdout. A sign flip between them means it was curve-fit.
- Data you have already looked at is never a holdout again.
- Test on the **longest history from the start.** For crypto, that means at least 2018 onward, so it includes 2018, 2022 and other crashes. For equities, include 2020 and 2022.
- **Best of N structurally different variants:** the winner carries selection bias that a parameter plateau can't remove. Report N. Re-test only the winner on data none of the N saw, and expect it to shrink. "The lone survivor of 5" is itself a warning.
- **Testing a stop, filter or other add-on legitimately:**
  1. Freeze the exact rule before looking.
  2. Run it on train and holdout once.
  3. Keep it only if it beats the no-add-on version in **both** periods and across rolling windows.
  4. Never pick the threshold (2% vs 3% vs 5%) on the holdout.

## 5. Robustness gate

Use 12-month windows stepped 3 months, scored with the audited ledger.

| Gate | Pass |
|---|---|
| Positive windows | ≥80% |
| Mean and median | both >0; median/mean ≥0.70 |
| Worst window | better than −30% |
| Drop the best 1 / best 3 windows | mean still >0 |
| Bull / bear windows (by the asset's own return) | ≥8/10 / ≥2/4. Fewer than 4 bear windows means "underpowered", not "passed" |
| Parameter neighbours | the majority also pass |
| A second instrument, config unchanged | works |

Caveats:
- Overlapping windows are worth about a quarter of their count as independent samples.
- Median/mean partly measures leverage: dropping from 5x to 3x passes it mechanically.
- Check that neighbour cells aren't secretly identical.
- Variant gaps under about 20% relative on one window are noise, since shifting the start date alone moved results by 64 pp.
- Compute the top-3-trade share of PnL. If it is 100% or more, the effective sample is about 3.

## 6. Leverage comes last

Establish a positive edge at 1x first, because leverage amplifies a negative edge as well. Report the liquidation risk and the largest single-position loss. Recent-window rankings at different leverage levels rank the leverage, not the edge.

## 7. Report honestly

- Label every number with its basis: realized or MTM, warmed, engine date, fees, leverage.
- Count trials honestly (994 runs over shared intervals are not 994 discoveries).
- Expect live returns at roughly **one fifth to one half** of in-sample.
- Short horizons are a coin flip. A trend follower can be negative in 55% of 7–30 day windows, so say so before anyone goes live.
- Retract loudly: add a dated CORRECTION banner, keep the old figure struck through, and re-check every decision that used it.

## Red flags: stop and re-check

| Thought | Reality |
|---|---|
| "It beat SPY this year" | One loud year is not a strategy. +27.7% over 4 quarters was +55% vs QQQ +116% over 18. |
| "The stored result says +X%" | Re-run it. Stored rows drifted by hundreds of percent across engine versions. |
| "This stop / filter improves the holdout" | Choosing it because of the holdout is selecting on the holdout. Every stop we tested flipped sign between periods. |
| "Passes 8/8 neighbours" | Were the cells independent? Did they share a graph bug? |
| "It worked in the week that motivated it" | That pullback entry was +18% in that week, −3% on the holdout, and earned a tenth of the baseline over 4.5 years. |
| "Higher leverage looks more robust" | That was a warmup artefact. 9x lost 99.99% on one position. |
| "I'll build the daily close from 15m bars" | That gives the extended-hours close. Use native series. |
| "Just one more tweak to rescue it" | A rule that failed its frozen test is rejected. Record it and move on. |

Details and evidence for each trap: [traps.md](traps.md). Worked examples: the `arrowalgo-strategy-case-studies` skill.
