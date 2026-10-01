# Provider Quirks

These are behaviours that make a backtest diverge from live trading, or that break graphs on one provider only. Last checked: 2026-09-30.

## All providers

- **Funding is not modelled** on perpetual futures. Estimate it from the exchange's public funding history: for a 1x BTC long that was 0.6–5% a year, or 10–17% of equity over multi-year spans.
- Fees are about 5 bp per side on Binance. A 100% allocation doesn't reliably reserve its own entry fee, so request about 99.95%.
- **`annualizedReturn` is currency-scaled**, roughly 100× the percentage on a 10k account. Don't use it.
- Read `markToMarketReturn` together with `performanceBasis`. `totalReturn` only counts realized PnL while a position is still open.
- Platform indicators may not match the textbook formula. For example, VWAP is rolling, not session-anchored, and RSI may restart on a window. If you port a result from elsewhere, compare values with `get_backtest_debug_at_time` first.
- `order_history` and `TrailingStop` have **no pair scoping**, which makes them unsafe in multi-pair graphs.

## Binance (USDT-M futures and spot)

- **Live futures rejects a limit BUY priced below 0.95 × mark** (the PERCENT_PRICE filter); spot allows 0.5×. Backtests don't enforce this, so a backtest of a "park the order far below market" design is fiction. A live-safe pattern is to move the order only while `target >= 0.955 × close`.
- On spot, the SELL quantity is clamped to inventory after the base-currency entry fee (for example, 0.01 → 0.00999).

## Hyperliquid

- The watcher type is `Data Watcher/HyperLiquid` and the exchange is `HyperLiquid` (capital L). Pairs end in `-USDC`, and HIP-3 pairs look like `XYZ-GOLD-USDC`.
- **Perps only.** BUY/SELL are rejected, so use `FUTURE_OPEN` / `FUTURE_CLOSE`.
- **There is no 6h interval.** The scenario is accepted but fails later on missing candles. Use 4h.
- `market_gain` can read 0, so compute buy-and-hold from candles. Realized `totalReturn` can be positive while the final USDC balance is negative, so score from `finalBalance` and full orders.
- Sanity-check `get_candles` before trusting a window (see the candle checks in `running-arrowalgo-backtests`).

## Alpaca (US equities and ETFs)

- Pairs look like `SPY-USD`. `FUTURE_OPEN` / `FUTURE_CLOSE` are margin orders capped at 2×, and you can only short names that are shortable.
- **Zero fees and no slippage model:** fills land exactly at the candle close, so add your own cost model. Market orders are rejected in extended hours live.
- **Don't rebuild a daily close from intraday bars.** The last 15m bar is the 20:00 ET extended-hours close, not the official 16:00 close. Fetch `1d` bars directly.
- Daily session candles end on the following UTC calendar day.
- Candles are split-adjusted (`"adjustment":"split"`). The NVDA 1d bar on 2024-06-10 has a bogus high, so be careful with high-based indicators across that date.
- On a long lookback, check the first window's indicator values in debug frames rather than trusting coverage flags.
- Free SIP data is delayed 15 minutes.
