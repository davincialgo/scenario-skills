# Validation Traps

Each trap below happened in real research and changed a conclusion.

| # | Rule | What went wrong |
|---|---|---|
| 1 | Pass an explicit `limit` to `get_candles`, and fail if the count you get back reaches the cap | The default of 100 bars truncated 12-month windows to about 5 months. One MSFT window went from +9.95% to −7.74% because the benchmark and the MTM price were read from bar 100. |
| 2 | Audit orders with `format:"full"`, and throw if `leverage` is missing | The summary rows drop leverage, so the scorer re-sized every order at 1x and returned the identical −21.51% for 1x, 1.5x and 2x. At the true 2x, the worst window was −101% and positive windows fell from 8/14 to 0/14. |
| 3 | Gate on `warmupHours` | A cold-start run skipped 111 days of losses: +68.7% instead of +37.85%, while reporting "finished", no warnings and no coverage issues. |
| 4 | Never rebuild a series the platform already publishes | Daily closes resampled from 15m bars are the 20:00 ET close. 891 of 1,237 days differed, a volatility gate's flip dates moved, and +151% became +91%. |
| 5 | When a number won't reproduce, check provenance before semantics | The diagnosis "ADX implementation changed" was retracted: the row carried June ids inside an August campaign, and siblings sharing the same ADX node reproduced to 4 dp. |
| 6 | Watch for selection artefacts | "All new entries satisfy ADX>30" was caused by the run trading fewer bars, not by a change in the indicator. |
| 7 | Guard entry and exit with one state | Independent SMA50 entry and SMA200 exit blocks produced 34 round trips and 3.2% of equity in fees within 5 months. The churn was invisible in-sample because the exit rarely bound. |
| 8 | Measure a gate's duty cycle | A "regime switch" on TQQQ's own volatility was on 100% of days, so the variant was identical to the plain strategy. |
| 9 | Don't AND a slow Latch with fast conditions | A 1d Latch in a 15m graph only emits at the daily boundary, which gave 1 order in 3 months. Use a variable writer and reader instead. |
| 10 | Don't judge on one year or four quarters | 4 quarters at +27.7% became 13/18 quarters at +55%, against QQQ +116%. |
| 11 | Short OOS windows that end with an open position are bets on that position | +1,870% MTM was −1.8% realized. |
| 12 | Re-run stored baselines before using them as the bar | "V85 −5.33% vs C16 +84%" reproduced neither number. |
| 13 | Rebuild the control after any wiring change | Two logically identical exits gave +1,026% and +1,245% (a platform lag, since fixed). Compare against a rebuilt control. |
| 14 | Concurrent launches corrupt results silently | A 0-order "finished" run looks legitimate for a gated strategy. |
| 15 | `profit_usd` is gross of fees | Summing it overstated profit by about 10%. |
| 16 | Indicator names don't guarantee identical formulas | Platform RSI(2) restarted on a 20-close window, and VWAP is rolling. Compare values in debug frames before porting a result. |
| 17 | "Remove the best 3 trades" on a fixed path is not a counterfactual | It subtracts recorded PnL without replaying the capital path. Use it as a diagnostic, not a gate. |
| 18 | Losing less is not winning under an absolute objective | TLT −12% vs hold −45%. |
| 19 | A cheap one-year screen misleads | ETH led on 2022, then made +15.9% vs hold +115%, with a 55.6% drawdown over the full span. |
| 20 | The most persuasive evidence (the user's own bad week) is the least reliable | The pullback entry was +18% that week, −3% on the holdout, and made a tenth of the baseline over 4.5 years. |
| 21 | Stops flip sign between periods | Every 2–5% stop and break-even stop helped 2025–26 and hurt 2022–24. |
| 22 | Trust a sizing simulator only once it reproduces the platform window by window | It was validated to a mean bias of 0.0 pts before its 500-start resample was believed. |
| 23 | Your own evaluator's bugs come first | Write adversarial synthetic tests: mutate future prices, check fee reservation, enforce date fences. |
| 24 | Frozen data must stay frozen | Every overlapping bar must match exactly on re-fetch. Never splice an old adjusted prefix onto a newly re-based series. |
| 25 | A walk-forward `overfitScore` is not an overfitting measure | It compares raw returns over windows of different lengths and tracks leverage. Use annualized OOS/IS and parameter stability instead. |
| 26 | A random-start resample proves start-date insensitivity, not an edge | Every sample reuses the same history. |
| 27 | Count trials honestly | 1,493 runs across 17 rules are not 1,493 independent tests. PBO and DSR need the honest count. |
| 28 | Long-only timing overlays are crash insurance | Across 24 names, outperformance correlated with the asset's max drawdown (r = −0.72). The full-period win came entirely from a window that opened three weeks before a crash. |
