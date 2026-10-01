# Example Scenario Graphs

Each file has the form `{ name, warmupHours, graph: { nodes } }`, in submit format: `inputs[].link` is the **source node id**. Create one with:

```js
create_scenario({ name: f.name, graph: f.graph, warmup: f.warmupHours })
run_backtest({ scenarioId, startDate, endDate,
               startBalance: { binance: { USDT: 10000, BTC: 0 } },   // alpaca: { USD: 10000, QQQ: 0 }
               futureType: "isolated", positionMode: "one_way", saveLogs: true })
```

Every file passes `node ../../building-arrowalgo-scenarios/validate-graph.js <file>`.

## Verified (these are the graphs the reported numbers came from)

| File | Nodes | What it shows | Numbers (current engine) |
|---|---|---|---|
| `sma200-regime.json` | 10 | The simplest correct trend template: a flat-guarded entry above the daily SMA200 and an exit below it. Binance BTC-USDT futures, 1x | The control every idea should beat. The support-entry study reported an SMA200 regime at 2022–24 +142.8%, 2025–26-09 −16.4%, 2018–21 +236.7%. These may come from candles rather than a platform run of this file, so re-run it |
| `v80-btc-4h-trend-pyramid-5x.json` | 39 | 4h breakout pyramid with a 7-way AND entry (VIDYA, ADX>30, +DI>−DI, ATR expansion, volume, slope, daily macro variable). Exit on trend reversal or a stale position. 5x, 15% adds | 2022–24 train +261%; holdout 2025-01..2026-09-18 +8.9%; unseen 2026-04..09 +25.2% vs BTC +12.5%. Calendar years: −20 / +97 / +129 / −7% |
| `v85-riskstop8-6x-sma150.json` | 47 | The V85 family with an add gate (adds only when flat or PnL > 6%), a −8% PnL stop exit, SMA150 macro, 6x / 25% adds, Max Repeat 3 | 26 rolling windows: 20/24 positive, mean +105%, worst −21.4%, median/mean 0.64 (fails the gate) |
| `live55-s5.json` | 33 | Advanced patterns: variables as remembered levels, `math/gate` state machine, level invalidation, a limit price input, and a live Binance futures price band (≥0.955 × close) | 2022–24 +94% (BTC +101%); 2025–26-09 −5.1% (BTC −13%); 2018–21 +111% (BTC +530%). Rejected: a market-entry twin beats it |
| `btc-out200-ORIGINAL-churns.json` | 7 | **Teaching example of a bug.** SMA50 entry and SMA200 exit with no state guard: when SMA50 < close < SMA200 it enters and exits on alternate days | 2026-04..09: 34 round trips, 3.2% of equity lost to fees |

## Unverified (rebuilt from specs; run before trusting)

| File | What | Must reproduce |
|---|---|---|
| `unverified/v85-5x-adx20-RECONSTRUCTED.json` | V80 + 25% adds + 5x + ADX>20 + an add gate (in_position < 0.5 OR PnL% > 8) | 2022–24 +1,026.5% (MDD 37.6), 2025-01..2026-09-18 +51.7% (MDD 23.4) |
| `unverified/btc-out200-GUARDED-untested.json` | out200 with the fix: enter only if close > SMA50 AND close ≥ SMA200 | +16.6% on one trade in a local replay of 2026-04..09; never platform-tested |
| `unverified/qqq-vwap-j-RECONSTRUCTED.json` | Alpaca QQQ-USD 15m: buy when close ≤ VWAP(26) − 2·ATR14, sell when close ≥ VWAP or close ≤ VWAP − 3·ATR, no Thursday entries. `indicator/TimeFilter` serviceName unknown | 2026-05..08 quarter about +10.1% with about 139 trades. Remember it **loses to QQQ hold** over 18 quarters |

If an unverified graph doesn't reproduce its numbers, treat the graph as wrong, not the engine.
