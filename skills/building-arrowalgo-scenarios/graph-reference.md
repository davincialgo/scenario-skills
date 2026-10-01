# ArrowAlgo Graph Reference

Field names in this file come from graphs the engine accepted and ran. Call `get_skills` for the current catalogue. Items marked **(uncertain)** were seen working, but the docs don't confirm them.

## Tool shapes

```jsonc
create_scenario({ "name": "...", "graph": { "nodes": [ ... ] }, "warmup": 1224 })   // warmup in hours
run_backtest({ "scenarioId": "...", "startDate": "2025-01-01", "endDate": "2026-01-01",
               "startBalance": { "binance": { "USDT": 10000, "BTC": 0 } },
               "futureType": "isolated", "positionMode": "one_way", "saveLogs": true })
```

`startBalance` for each provider:

| Provider | `startBalance` |
|---|---|
| Binance | `{binance:{USDT:10000, BTC:0}}` |
| Hyperliquid | `{hyperliquid:{USDC:10000, <BASE>:0}}` |
| Alpaca | `{alpaca:{USD:10000, SPY:0}}` |

## Minimal accepted graph (submit format)

```jsonc
{ "nodes": [
  { "id": 1, "type": "Data Watcher/Binance", "serviceName": "Binance", "pos": [100,100],
    "inputs": [], "outputs": [{"name":"close","type":"number","links":[],"slot_index":0}],
    "properties": {"Pair":"BTC-USDT", "Interval":"1d", "Output":"close"} },
  { "id": 2, "type": "math/fix_number", "serviceName": "math", "pos": [100,300],
    "inputs": [], "outputs": [{"name":"value","type":"number","links":[],"slot_index":0}],
    "properties": {"number": 0} },
  { "id": 3, "type": "math/condition", "serviceName": "math", "pos": [400,100],
    "inputs": [{"name":"A","type":"number","link":1,"slot_index":0},     // link = SOURCE NODE ID
               {"name":"B","type":"number","link":2,"slot_index":0}],
    "outputs": [{"name":"true","type":"number","links":[],"slot_index":0},
                {"name":"false","type":"number","links":[],"slot_index":1},
                {"name":"result","type":"number","links":[],"slot_index":2}],
    "properties": {"OP": ">", "Inputs": 2} },
  { "id": 4, "type": "Action/BUY", "serviceName": "BUY", "pos": [700,100],
    "inputs": [{"name":"Trigger","type":"number","link":3,"slot_index":0}],  // condition TRUE pulse
    "outputs": [],
    "properties": {"Name":"buy", "Exchange":"Binance", "Pair":"BTC-USDT", "Order Type":"Market",
                   "Amount":0.01, "Amount as":"Fixed Amount",
                   "Cancel open orders and replace?":"Keep all open orders",
                   "Repeat order if consecutive signals occur?":"No"} } ] }
```

Node ids don't have to be contiguous.

## Node catalogue

| type | serviceName | inputs (slot order) | outputs (slot) | key properties |
|---|---|---|---|---|
| `Data Watcher/Binance` | `Binance` | — | one, named after `Output` | `Pair`, `Interval`, `Output` (open/high/low/close/volume/hl2/hlc3/ohlc4/obv; perps also fundingRate, sumOpenInterest…) |
| `Data Watcher/HyperLiquid` | `HyperLiquid` | — | same | `Pair` e.g. `BTC-USDC` |
| `Data Watcher/Alpaca` | `Alpaca` | — | same | `Pair` e.g. `SPY-USD` |
| `indicator/sma` | `SMA` or `indicator` (both accepted; uncertain which is canonical) | `in` | `out` | `time_period` |
| `indicator/ema` `hma` `rsi` `roc` `lag` `min` `max` `sum` `stddev` `linregslope` `ui` | `indicator` | `in` | `out` | `time_period` |
| `indicator/vidya` | `indicator` | `in` | `out` | `short_period`, `long_period`, `alpha` |
| `indicator/adx` `atr` `natr` `cci` | `indicator` | `high`,`low`,`close` | `out` | `time_period` |
| `indicator/di` | `indicator` | `high`,`low`,`close` | `plus`(0), `minus`(1) | `time_period` |
| `indicator/vwap` | `indicator` | `close`,`volume` | `vwap` | `time_period` (rolling, not session-anchored) |
| `indicator/orderblock` | `indicator` | open,high,low,close | zoneLow, zoneHigh, direction, touched, invalidated | `time_period`, `displacement_multiplier` |
| `indicator/PositionStatus` | `PositionStatus` | `price` | `in_position`(0), `entry_price`(1), `unrealized_pnl%`(2), `candles_in_position`(3), `direction`(4) | `Name`, `Exchange`, `Pair` (always set) |
| `indicator/Latch` | `Latch` | `SET`(0), `RESET`(1) | `value` | `default` |
| `indicator/TrailingStop` | `TrailingStop` | `Price`, `Stop Distance %` | `True`(0), `False`(1) only. Slot 2 gives zero results with no error | `Market`, `Position Type`, `Exchange`, `Pair` |
| `indicator/JAVASCRIPT` | `JAVASCRIPT` | declared names | declared names | see below |
| `math/condition` | `math` | `A`,`B`[,`C`…] | `true`(0), `false`(1), `result`(2) | `OP` (> < >= <= == != && \|\|), `Inputs` (2–10) |
| `math/fix_number` | `math` | — | `value` | `number` |
| `math/variable` | `math` | `in` (writer) or none (reader) | `value` | `block_name`, `default` |
| `math/gate` | `math` | `v`,`A`,`B` | `out` (= v ? A : B) | — |
| `math/operation` | `math` | `A`,`B` | `result` | `OP` (+ - * / % ^ max min) |
| `math/scale` | `math` | `in` | `out` | `factor` |
| `math/clamp` | `math` | `in` | `out` | `min`, `max` |
| `math/abs` | `math` | `in` | `out` | — |
| `math/rank` | `math` | `A`… (≤20) | one per input | `Inputs`, `Order`, `Mode` (rank/top_k), `K`. top_k includes ties |
| `Action/FUTURE_OPEN` | `FUTURE_OPEN` | `Trigger`, `price`?, `Amount`?, `Leverage`? (this order) | — | see below |
| `Action/FUTURE_CLOSE` | `FUTURE_CLOSE` | `Trigger`, `price`?, `Amount`? | — | same minus Leverage |
| `Action/BUY` / `Action/SELL` | `BUY` / `SELL` | `Trigger`, `price`?, `Amount`? | — | spot only (not on Hyperliquid) |

How the `serviceName` follows from `type`:
- `Data Watcher/X` → `X`
- `math/*` → `math`
- `Action/X` → `X`
- `indicator/PositionStatus|Latch|TrailingStop|JAVASCRIPT` → that name
- any other `indicator/*` → `indicator`

## Action properties (exact strings)

```json
{ "Name": "long entry", "Exchange": "Binance", "Pair": "BTC-USDT",
  "Position Type": "Long", "Order Type": "Market",
  "Amount": 95, "Amount as": "% of account",
  "Margin Type": "USDT", "Leverage": 1,
  "Cancel open orders and replace?": "Cancel open orders only",
  "Repeat order if consecutive signals occur?": "No",
  "Max Repeat Orders": 0 }
```

| Property | Values / notes |
|---|---|
| `Exchange` | `Binance`, `HyperLiquid`, `Alpaca` |
| `Position Type` | `Long`, `Short` |
| `Order Type` | `Market`, `Limit`. `Limit` adds the `price` input |
| `Amount as` | `% of account`, `Fixed Amount`, `From Input`, `From Input (%)`. For the `From Input` modes, omit `Amount` and add an `Amount` input after `Trigger`/`price` |
| `Leverage` | 1–20; Alpaca max 2 |
| `Cancel open orders and replace?` | `Cancel open orders only`, `Cancel all open orders`, `Keep all open orders`. BUY/SELL also have `Cancel open buy orders only`, `Cancel open sell orders only` |
| `Max Repeat Orders` | `0` = unlimited. The count includes the entry's own earlier orders, so `2` means one add |

**Sizing a full position:**
- Entries commonly use `Amount: 95`, `% of account`, which leaves headroom for fees and slippage. A funded 1x "all-in" needs about 99.95%, because 100% doesn't reliably reserve the fee.
- To close everything, use `FUTURE_CLOSE` with `Amount: 100`, `Amount as: "% of account"`, and the same `Pair` and `Position Type` as the open. The verified examples use exactly this.

**`FUTURE_CLOSE` `Amount`** is a % of the *remaining* position, and it re-fires on every bar its trigger is true. A "close 50%" on a level trigger halves the position again and again.

## Limit orders

- An order is created at bar close and fills on the next bar if `low <= limit`, at the limit price.
- To move a resting order, re-trigger it every bar with `Cancel open orders only`.
- The engine accepts limits far from market. Binance futures live rejects them (see provider-quirks).

## JavaScript block (`indicator/JAVASCRIPT`)

```json
{ "type": "indicator/JAVASCRIPT", "serviceName": "JAVASCRIPT",
  "inputs":  [{"name":"btc.close","type":"number","link":1,"slot_index":0}],
  "outputs": [{"name":"score","type":"number","links":[],"slot_index":0}],
  "properties": {
    "source": "function compute(inputs, params) { const c = inputs.btc.close; return {as_of: inputs.as_of, ready: true, outputs: {score: c[c.length-1]}}; }",
    "input_names": ["btc.close"], "output_names": ["score"], "history_bars": 1,
    "params": {}, "runtime": "quickjs-0.31.0-wasm-v1", "dependencies": {} } }
```

Inputs and outputs:
- 1–10 numeric inputs, 1–16 outputs, and `history_bars` 1–2048.
- Slot names and order must equal `input_names` / `output_names`.
- All inputs must use the same interval and come from timestamped nodes. Pass constants through `params`.

What `compute` gets and returns:
- `inputs.<a>.<b>` are history arrays ending at `inputs.as_of`.
- Return `ready:false` during warmup.

Runtime limits:
- Stateless: a fresh runtime on every candle.
- No network, clock or imports; a 3 s wall-clock limit.

Debugging:
- Errors always show up in debug frames.
- Success frames need `saveLogs:true`.

In testing, an 11-block JavaScript graph reproduced a 114-block native graph exactly (176/176 values, identical orders).

## Warmup

- The example files store this as `warmupHours`; pass it to `create_scenario` as `warmup`. For 24/7 crypto, use the longest lookback × candle hours plus about 20% margin (SMA200 on 1d ≈ 200 × 24 × 1.2 ≈ 5,800 h).
- The engine backfills warmup automatically from the longest indicator chain, and also accepts a `warmup` value (in hours) on create. **Always confirm `warmupHours` in the results.** `0` or `null` means a cold start, so the result is not valid.
- Debug-check the first bar instead of trusting the number: open the first frame and confirm the slowest indicator is numeric, not "Waiting for N more candles". Market-hours providers deliver fewer bars per calendar hour (9,000 h gave only 258 daily SPY bars). A 252-bar daily indicator needs about 1.45× its calendar span.
- Slow adaptive indicators such as VIDYA, and long chains (ROC252 → lag → SMA), need extra history. Pass a larger `warmup` for them.
