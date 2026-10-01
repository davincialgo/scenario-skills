# Strategy Case Studies

These are the full write-ups behind the `arrowalgo-strategy-case-studies` skill. The research ran on ArrowAlgo from April to September 2026. Every figure is the latest corrected one. Figures marked **[RETRACTED]** or **[STALE ENGINE]** are kept so you can recognise them if you see them quoted elsewhere. Don't reuse them.

**Re-run before quoting.** The engine changes over time, and stored results drifted by hundreds of percent between engine versions. Treat any number you didn't produce on the current engine as stale until you re-run it.

The consistency gate used throughout (12-month windows stepped 3 months, audited order equity):
- ≥80% of windows positive;
- median/mean ≥ 0.70;
- drop-best-1 and drop-best-3 both still positive;
- worst window better than −30%;
- ≥50% of bear windows positive;
- a majority of parameter neighbours pass;
- the strategy works unchanged on a second instrument.

## 1. BTC 4h trend/pyramid family (V77 → V80 → V81 → V83 → V85)

**Idea.** Breakout trend-following on BTC with pyramiding adds while a trend confirms.

**Asset and data.**
- Binance BTC-USDT futures, isolated, 10k USDT, 5 bp fees.
- 4h signals with a daily macro gate.

**Graph (V80 base).**
- Daily close > SMA50 is written to the variable `macro_bull`, which is read by the 4h graph. This is the cross-timeframe variable pattern.
- 4h entry is a 7-way AND:
  - close > VIDYA(10,150,0.2)
  - ADX(14) > 30
  - +DI > −DI
  - ATR14 > SMA14(ATR)
  - volume > SMA14(volume)
  - LinRegSlope20 > 0
  - macro_bull
- Entry action: FUTURE_OPEN market, Amount % of account, Repeat=Yes. Every qualifying 4h bar adds (a pyramid).
- Exit (OR), FUTURE_CLOSE 100%:
  - LRS25 < 0 AND close < VIDYA (trend reversal), or
  - PositionStatus unrealized_pnl% < 5 AND candles_in_position > 8 (fast stale cut).

**Members.**

| Member | Leverage | Add size | Other |
|---|---|---|---|
| V77 | 5x | — | no stale cut |
| V80 | 5x | 15% | — |
| V81 | 7x | 25% | — |
| V83 | 9x | 25% | saved graph actually has Amount 30 |
| V85 | 9x | 25% | adds only when flat OR unrealized PnL > 8% (in_position < 0.5 OR pnl% > 8, ANDed into the entry) |
| V85-5x ADX20 | 5x | 25% | ADX threshold 20 |
| V85-3x ADX20 | 3x | 25% | ADX threshold 20 |

**Corrected family baselines (2026-09-19 engine; train 2022-01-01..2025-01-01, holdout 2025-01-01..2026-09-18, BTC −13.56% over the holdout).**

| | V77 5x | V80 5x/15% | V81 7x | V83 9x | V85 9x |
|---|---|---|---|---|---|
| Train | +601% | +261% | +1,374% | +1,081% | +2,932% |
| Holdout | **−20.1%** | **+8.9%** | **−12.6%** | **−16.4%** | **−7.5%** |

- Holdout drawdowns were 46–55% for V83 and V85.
- **[RETRACTED / STALE ENGINE]**:
  - V85 +6,750%, OOS +142%, WF overfit 0.623.
  - V83 +4,961%, +189.9%.
  - V80 "+1,512% / +68.7% OOS" (a cold-start run that skipped 111 days of January losses).
  - V80 +1,440% / +37.85% (a June row never re-run).
  - All of the "higher leverage = more robust" lessons.

**V80 out-of-sample (2026-04-08..09-18, unseen).**
- +25.2% realized vs BTC +12.5%, MDD 11.8%, 7 positions.
- Sat in cash through a −28.7% crash and pyramided the recovery.
- Calendar years on the current engine: 2022 −20.0%, 2023 +96.9%, 2024 +129.0%, 2025 −7.35%. Two of five years were losses.
- In the market only about 10% of the time.
- Exposure-matched 0.51x hold returned +79% vs V80 +323% (2021-01..2026-07), so the stack is not decoration. Constant-leverage BTC holds at 3x and 5x are wiped out by volatility drag.

**ADX refit (pre-registered plateau rule, on a V80 clone).**

| ADX threshold | Train | Holdout |
|---|---|---|
| 18 | +626% | +50.8% |
| **20 (selected)** | **+686%** | **+56.7%** |
| 22 | +714% | +48.9% |
| 25 | +598% | +17.8% |
| 30 | +261% | +8.9% |

- Caveat: meta-selection leak. The decision to refit was made after ADX30 failed in 2025-26.
- Clean unseen slice only: ADX20 +38.3% vs ADX30 +25.2% vs BTC +12.5%.

**V85-5x ADX20: current corrected baseline (engine as of 2026-09-30).**
- 2022-24: +1,026.5% (MDD 37.6).
- 2025-01..2026-09-18: +51.7% (MDD 23.4).
- 2018-06..2021-12: +97.5% (MDD 68.0) vs BTC +530%.
- **[STALE ENGINE]**: +1,245% / +57.7% / +136.5%. Do not quote these.

**Rolling 12-month windows (run 2026-09-23/25; may shift slightly on a re-run).**

| Variant | Positive | Mean | Median | Worst | med/mean | Drop-best-3 | In-window DD |
|---|---|---|---|---|---|---|---|
| V85-5x ADX20, 17 windows | 16/17 | +137% | +65.6% | −30.8% | 0.48 (fails) | +90% | — |
| V85-5x ADX20, 26 windows 2019-26 | 23/25 | — | — | — | 0.45 | — | 61.8% (2021) |
| V85-3x ADX20, 17 windows | 16/17 | +53.5% | +42.8% | −15.9% | 0.80 | +36% | — |
| V85-3x ADX20, 26 windows | 24/25 | — | — | — | — | — | 34.8% |

- **V85-3x ADX20 passes every gate since 2021-09 (10/10).** Holdout +48.0%, MDD 13.6%.
- Post-tuning windows (start 2025 or later): 5x 3/3 positive with median +46%; 3x 3/3 with median +28%. That is about 1/5 of the in-sample level, which is the honest live expectation.
- V85-5x beats C16 in 15 of 16 windows. Sign-test p = 0.0005, but there are only about 6–7 independent years.

**What failed on V85 (each tested against a frozen rule; none beat baseline in both periods).**
- Fixed stops at 2–5%. A 3% stop: train 1246 → 816%, holdout 57.7 → 16%.
- Break-even stops.
- Take half profit at +3/5/8%.
- Capping adds at 3/5/8.
- Entering only above daily SMA200 (holdout 3.8%).
- Smaller first buy. This is a risk dial, not an edge.
- Skipping entries near the 15-day high. The design is a breakout system, and 78% of entries land in the top quartile of the range.
- PB01 pullback entry (donchian(90) middle): train +129%, holdout −3.0%. It won the one motivating week by +18% and lost over 4.5 years.
- Level-only exit while losing: collapses 2018-21 to −5..−30% with 80%+ drawdown.
- G1 four-SMA trend gate: 12-8-4 against its control, mean −18.9 pts. A risk dial.
- ETH transfer: holdout +285% but drop-best-2 is −2.4%, MDD 55.5%, and 60% of trades overlap BTC trades. Not a diversifier.
- 9x: one position lost 99.99%.

**Key lessons.**
- Lateness of entry is real (median first buy is 14.5% above the 20-day low) but does not predict loss. Winners and losers are equally late.
- The loss source is give-back: 30 of 61 trades that were once in profit closed at a loss, and this cannot be exited away.
- Use 3x if the consistency gate matters; use 5x for growth.

---

## 2. BTC out200 (daily SMA hysteresis, 1x)

**Idea.** Long BTC when close > SMA50, flat when close < SMA200. Hysteresis is meant to cut whipsaw.

**Asset and data.** Binance BTC-USDT 1d, 1x, 100% of account. Seven nodes.

**Results.**
- 2022-26, 14 windows: 12/14 positive, med/avg 0.98. **[SUPERSEDED: do not re-quote]**
- 2018-2026, 26 windows: 21/26 positive, avg +90.5%, median +55.8%, med/avg 0.62, worst −29.2%, drop-best-3 +50.4%, beats SPY in 19/26 windows but its own hold in only 10/26.
- Falling-BTC windows: positive in only 2/7, average −9.1%. It protects (beats hold in 5/6) but does not earn.
- Parameter neighbourhood passed: 8/8 adjacent cells reached ≥10/14 positive, and the chosen cell was not the peak.
- Cross-asset: works on ETH only. Six of seven alts show a negative median with a positive mean, the "lucky few" profile.

**Defect found out of sample (2026-04..09).**
- There is no state guard. When SMA50 < close < SMA200, both OPEN and CLOSE fire, so it enters and exits on alternate days.
- That produced 34 round trips and 3.2% of equity in fees in 5 months.
- Result: +8.22% vs hold +6.86%, and the whole gain came from one position still open at the end.
- The entire 9-cell grid and the v60 leverage ladder share the bug. At 5x the "+32%" figure includes −27.9% of realized churn.
- A guarded version (enter only if close > SMA50 AND close ≥ SMA200) gave +16.6% on one trade in a local replay. **It has not been platform-tested.**

**Lesson.** Make one state drive both actions, or guard the entry with the exit condition. The defect hid in-sample because the exit SMA rarely binds in a bull run.

---

## 3. C16 OrderBlock (BTC, multi-timeframe)

**Idea.** OrderBlock(20, displacement 2) entry stack plus UI(10) < 2 filter ("UI A15"), on BTC 5x with 15% adds and 1h protection exits.

**Original audit (06-22) [STALE ENGINE].**
- 2022 −19.7% vs BTC −64%; 2023 +226%; 2024 +385%.
- Walk-forward: 4/4 OOS positive, average +75%, overfit 0.87.
- The best OrderBlock period drifted from 20 to 10. Some windows had only 7–12 positions.
- Verdict then: "not fake but concentrated".

**Today's engine (09-25, 26 windows).**
- Ten pre-2021-12 windows are unscoreable because of 1h data warnings.
- On the remaining 16 windows: 14/16 positive, mean +42.3%, median +47.2%, worst −19.3%. Lowest mean of all the variants tested.
- The earlier "C16 +84.05% vs V85 −5.33%" comparison came from stale or mismatched runs and does not reproduce.

**What failed.**
- Regime routers.
- VerticalExit and TrailLatch variants (−98.9% on the recent window: one dominant long drained equity).
- Split first entry.
- Post-protection re-entry sizing.
- Short-sleeve overlays: they lower drawdown but always dilute return.

**Lesson.** A high walk-forward overfit score plus parameter drift means "keep as control, size small". The engine-era comparison flipped the ranking against V85.

---

## 4. QQQ VWAP mean reversion ("J")

**Idea.** From a video claim ("buy 2 ATR below VWAP on Nasdaq"). Alpaca 15m, rolling VWAP(26) (not session-anchored), ATR14.

**Rules.**
- Buy at market, 95% of account, when close ≤ VWAP − 2·ATR.
- Sell when close ≥ VWAP (take profit) or close ≤ VWAP − 3·ATR (stop; a dynamic band, not anchored to entry).
- No Thursday entries (TimeFilter days Mon,Tue,Wed,Fri).
- Repeat=No, overnight holds allowed.

**Original 12 months (Aug 2025–Aug 2026).**
- J QQQ +27.7% vs SPY +20.4%.
- QLD +65.9%, TQQQ +91.1%.
- Walk-forward 3/3 OOS positive.
- On BTC: −87% per year. Never port it without a regime filter.

**Corrected audit (Sep 2026, 18 quarters 2022-02..2026-08, bit-exact local replica).**
- J QQQ: 13/18 positive, compounded +55% vs QQQ hold +116%, med/avg 0.64.
- J TQQQ: comp +306% vs hold +210%, worst −41%.
- Two-state switch (QQQ 20-day realized vol > 15% → run J; otherwise hold QQQ): **13/18, +91%, which LOSES to QQQ hold +116%.**
- **[RETRACTED]** 16/18, +151%, and TQQQ +963%. The volatility input used the 20:00 ET close resampled from 15m bars instead of the official close.
- After the SEC fee and slippage, nothing unleveraged beats SPY (+71.5% over the span).
- The TQQQ "switch" gated on TQQQ's own volatility, which was always on, so it was plain J.

**Other findings.**
- Earns only in high-volatility regimes; about +1% per quarter in 2023-24.
- Passive limit entries halve returns (adverse selection). The strategy pays for immediacy.
- 68% of exits are stops.
- Filters with good in-sample math failed when re-run: the 2–2.75 ATR band entry, no-overnight, skip-first-hour, cooldown.
- Sequence effects beat per-trade spreadsheet math.

**Lesson.** One loud year is not a strategy. Validate across regimes before you claim to beat the index. Use native series, not resampled ones.

---

## 5. BTC support-limit entry (live55-s5)

**Idea.** Instead of buying late after confirmation, rest a LIMIT buy at the next support in a rising market.

**Final design (live55-s5).**
- Rising market: daily close > SMA200.
- Level: the 55-day high, lagged 1 bar, that close broke above. It is stored in variable `support_level`.
- The level is invalidated on a close more than 5% below it (`level_valid` variable) and re-arms on a new breakout.
- Limit buy, 95%, at level × 1.005. It is placed only while flat, armed, and within the futures band (target ≥ 0.955 × close).
- Exit: close < level × 0.95 OR close < SMA200, at market.

**Results (Binance futures 1x).**

| Window | live55-s5 | BTC hold |
|---|---|---|
| 2022-24 | +94.1% | +101% |
| 2024 | +76.5% | +120% |
| 2025-01..2026-09 | −5.1% | −13% |
| 2018-21 | +111.3% (DD 35%) | +530% |

- Funding costs 0.6–5% per year and is not modelled.
- Walk-forward: IS +83% vs OOS +8%, overfit 0.89, 2/6 OOS windows positive.

**What failed and why.**
- Market entry at the same levels beat the limit in 10/12 comparisons: adverse selection.
- v1 used the same line for entry and exit, so fills exited instantly.
- Without invalidation it rebought dead levels.
- Round 3 (wider chandelier stop, ladder fallback, core+adds) and round 4 (V85 probe-then-add, V80 stale exit, ADX20) did not beat it.

**Gotchas.**
- An add FUTURE_OPEN needs Repeat=Yes with Max Repeat Orders 0.
- "% of account" sizes on free balance.
- There is no cancel-only action.
- A FUTURE_CLOSE while flat does not cancel resting orders.

**Lesson.** Always build a market-entry twin, and check exchange order filters.

---

## 6. CCI washout filter (QQQ daily breakout)

**Setup.**
- Assumed base (not a replication): Donchian 20/10 on QQQ daily.
- Filter: min CCI27 over the signal bar and the prior 17 bars < −100.
- Next-open fills, 5 bp fee + 5 bp slippage per side, 2021–2026.

**Results.**

| | Net return | MDD | Profit factor | Trades |
|---|---|---|---|---|
| Base | +66.2% | 15.9% | 2.67 | 25 |
| With CCI filter | +28.4% | 19.9% | 1.94 | 15 |
| QQQ hold | +133.5% | — | — | — |

- Fixed-horizon event study: CCI-retained episodes show better 5/10-day averages, but the sample is too sparse to conclude anything.

**Lesson.** A filter that cuts exposure is not a quality improvement unless per-trade quality rises.

---

## 7. Sector participation / relative leadership (local replays, 2021H1–2026H1)

- **NG-001 (SPY when ≥6/9 sector ETFs are above SMA200):** +45.7% vs its own SMA200 control +56.5% and hold +102%. MDD 24%, 6/11 folds positive.
- **NG-002 (IWM/SPY ratio vs its 126-day mean):** +5.8% vs control +49%. Drawdown 32%.
- Both retired.

**Lesson.** Always compare against the simplest own-asset control (SMA200 in/out). Breadth proxies added nothing.

---

## 8. Ten-asset fixed rules (AMZN, ETH, SPY, IWM, GLD, TLT, XLE, XLF, AAPL, MSFT)

- All ten failed.
- 9/10 trailed their own buy-and-hold. Examples: SPY rule +21% vs hold +102% with only 6% drawdown; ETH +15.9% vs +115% with 55.6% drawdown.
- TLT "beat" hold only by losing less (−12% vs −45%).
- No candidate reached 8/11 positive half-years.
- META recovery lead: +193% vs hold +109% historically, but drawdown 32%, its simpler control earned +247%, and it lost 2% in the next 2.5 months while hold gained 18%.
- Triple RSI on SPY: +5.3% vs hold +98.8%. The quoted 90% win rate was not reproduced (68.75%).

**Lesson.** A cheap one-period screen (ETH 2022) is misleading. Count research executions honestly: 1,493 runs across 17 rules is not 1,493 independent tests.

---

## 9. Mega-cap long timing overlay (TSLA, MSFT, 24-name universe, TQQQ/SOXL/BTC)

**Idea.** Long when close > SMA(in) and SPY > SMA200; exit on close < SMA(out). Beat the stock itself by avoiding its drawdowns.

**Findings.**
- The TSLA neighbourhood is a ridge (6/9 cells beat hold). META, using a config tuned on TSLA, gave 2.96x vs 1.78x.
- But across 24 names only 4 beat hold AND ended above 1.0x.
- Outperformance correlates with the underlying's max drawdown (r = −0.72), so the overlay works only on names that crash.
- TQQQ 3.0x vs 2.3x and SOXL 7.9x vs 4.2x over the full period, but they beat own hold in only 3/14 and 6/14 rolling windows.
- The full-period win comes entirely from the 2022 crash: the test window opened three weeks before the worst drawdown on record.
- Invalid run: v54 "split sizing". FUTURE_CLOSE Amount is a % of the remaining position and re-fires each bar, causing a geometric halving cascade.

**Lesson.** A long-only timing overlay is crash insurance, not alpha. Beware windows that start just before a crash.

---

## 10. Shorts (BTC futures, Apr 2026) **[STALE ENGINE: never re-run on the current engine; treat as unverified]**

**Philosophy ("black swan catcher", from S-E1/E2).**
- Wide trailing stop (12–15%) so winners ride crashes.
- Tight hard cut (−3% to −5% PnL).
- 3x rather than 5x (bounce damage).
- Fast LRS(10) entry.
- Win rate 3–8%, with average winners above +100%.

**Candidates (2022 / 2022-24 / 2024 / 2025..Apr-2026).**

| Candidate | Type | 2022 | 2022-24 | 2024 | 2025..Apr-2026 |
|---|---|---|---|---|---|
| S-H1 | CCI+Stoch range short, 5x, 15% adds, cut −5% | +17.0% | +13.9% | −2.6% | +12.5% |
| S-E2-TS12 | post-rally bear, SMA200 gate, VIDYA+ADX40+−DI+LRS5, trail 12% | +58.7% | +17.4% | −17.4% | +28.3% |
| D1-SMA200 | crash detector, low bleed | +7.1% | +7.2% | +0.7% | −1.5% |

- What did not work: tight 5–8% trails, V80-style regime exits (too slow), high-win-rate designs, and 5x.
- Overlaying shorts on the C16 long lowered drawdown but always diluted return.
- The short graphs were not preserved, so only the results above are available.

---

## 11. Path-signature model (arXiv 2308.15135) and the JavaScript block

- **Capability:** an `indicator/JAVASCRIPT` block computing 21 order-2 signature features of BTC/ETH paths ran correctly on the engine. 176/176 values matched, with the expected BUY/SELL/BUY sequence.
- **Fitted paper test (local, holdout 2023–2026-06, 5 bp):**
  - TLT signature +4.7% (Sharpe 0.41) vs Markowitz −2.0%.
  - DBC/BND/VTI +16.3% (Sharpe 1.08) vs Markowitz +12.8% (1.07).
  - No statistically clear advantage; cost-sensitive.
- **Lesson:** platform capability ≠ edge. The demo coefficients were arbitrary.

---

## 12. arXiv edge experiments (EXP-001..007, Jul–Aug 2026, six assets, warmed OOS)

| Experiment | Idea | Result |
|---|---|---|
| EXP-001 | ROC trend + vol-aware exit | 2/6 positive |
| EXP-002 | 12m TSMOM + inverse-vol sizing | Failed the multi-window replication at portfolio level too; hold had the best Sharpe in 4/4 |
| EXP-003 | Multi-speed trend + turnover confirmation | GLD supplied 84% of profit |
| EXP-004 | Lagged ROC speed selector | 1/6 positive |
| EXP-006 | BTC/ETH cointegrated spread z-score | Market-neutral but no edge; the spread was not cointegrated in 3 of 4 windows |
| EXP-007 | Walk-forward Engle-Granger pair selection | Formation t-stat vs OOS return correlation −0.38 (wrong sign) |

**Lessons.**
- Decide whether the mechanism should exist in the asset before building anything.
- A component rejection does not reject a portfolio-level paper claim.
- Check the paper's preconditions (e.g. cointegration) on your own data.

---

## 13. Day-trading / small-profit routes (closed, Aug 2026)

Fast exits, profit targets, close-and-reopen, and 1h RSI dip-buying all lost. Examples:
- 1h RSI dip layer: bull +18.6% vs market +102%, OOS −3.7%.
- With a 30% stop: −45% (stop-cascade churn).

High win rate (72%) is achievable; positive expectancy from small wins was not. The loss tail dominates.

---
