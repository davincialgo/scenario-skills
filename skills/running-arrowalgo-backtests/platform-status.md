# Known Platform Issues: Fixed vs Open

Status is as observed through **2026-09-30**. Any result produced before a fix date may be wrong, so re-run it before relying on it. Re-verify an open item before you work around it; it may have been fixed since.

## Still open (work around these)

| Issue | Workaround |
|---|---|
| Large simultaneous launches cause timeouts and silent "finished" runs with 0 orders | Run ≤2 at once with a known control; void the batch if the control shows 0 orders |
| `run_backtest` HTTP 504 can still create the backtest | Never auto-retry; reconcile with `list_backtests` |
| `optimize` sweep returns a groupId but spawns no children (last seen Aug 2026) | Clone the scenario for each variant. `run_walkforward` works |
| `annualizedReturn` is currency-scaled (~100× on a 10k account) | Ignore it; compute it yourself |
| No-trade finished runs omit return fields | 0% only if final balance = start balance |
| Hyperliquid: `market_gain` = 0; realized return can be positive while final balance is negative; summary order status can be wrong | Buy-and-hold from candles; score from `finalBalance` and full orders |
| Hyperliquid 6h is accepted, then fails on missing candles | Use 4h or 1d |
| `order_history` and `TrailingStop` have no pair scoping | Avoid them in multi-pair graphs |
| Alpaca NVDA 1d bar on 2024-06-10 has a bogus high | Scan candles; avoid high-based indicators across that date |
| A walk-forward can report `finished` with null OOS metrics (not seen in Sep 2026 runs) | Inspect the child backtests |
| PositionStatus / last_profit pair-scoping fixes are verified in backtests only | Check live/demo behaviour yourself |

## Fixed (don't work around these anymore)

| Issue | Fixed |
|---|---|
| No indicator warmup (gated strategies were silent until indicators filled) | 2026-04 (old runs are invalid) |
| Futures `totalReturn` was realized-only with positions open at the end; `markToMarketReturn` was added | 2026-06 |
| Futures MDD wrong / skipped troughs / spot equity conversion (`account-equity-v2..v4`) | 2026-09-13 to 09-16 |
| `indicator/JAVASCRIPT` and `math/rank` rejected on create | 2026-09-15/16 |
| PositionStatus blended positions across pairs; `last_profit` used another pair's basis | 2026-08-12 |
| Dynamic `Amount as: From Input (%)` fired on a false trigger / shifted exit timing | 2026-07 |
| Alpaca daily warmup counted calendar days; false coverage warnings | 2026-07-14 |
| Alpaca candles not split-adjusted | 2026-08 |
| Cancelled limit orders kept their reserved margin ("Amount is zero!") | 2026-09-22 |
| Cancel-and-replace limit sometimes left the old order open | 2026-09-30 |
| PositionStatus read one bar stale depending on wiring (equivalent graphs gave +1,245% vs +1,026%) | 2026-09-30 |

## Not platform bugs (closed as caused on our side)

These are worth knowing because they look like engine bugs:

- A status-2 run read as "finished with 0 trades".
- `indicator/Latch` with `serviceName:"indicator"`, which causes time-limit failures.
- A "Links in these blocks are incorrect" rejection caused by stale inputs that formed a cycle.
- "ADX changed", which was a stored row that had never been re-run.
- C16 rerun differences, which came from an intentional ADX correction.
