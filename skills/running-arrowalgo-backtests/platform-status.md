# Known Open Platform Issues

Observed through **2026-09-30**. Before you work around one of these, re-check it: it may have been fixed since.

## Open issues and workarounds

| Issue | Workaround |
|---|---|
| Large simultaneous launches cause timeouts and silent "finished" runs with 0 orders | Run ≤2 at once with a known control; void the batch if the control shows 0 orders |
| `run_backtest` HTTP 504 can still create the backtest | Never auto-retry; reconcile with `list_backtests` |
| `optimize` sweep returns a groupId but spawns no children (last seen Aug 2026) | Clone the scenario for each variant. `run_walkforward` works |
| No-trade finished runs omit return fields | 0% only if final balance = start balance |
| Hyperliquid: `market_gain` = 0; realized return can be positive while final balance is negative; summary order status can be wrong | Buy-and-hold from candles; score from `finalBalance` and full orders |
| Hyperliquid 6h is accepted, then fails on missing candles | Use 4h or 1d |
| `order_history` and `TrailingStop` have no pair scoping | Avoid them in multi-pair graphs |
| Alpaca NVDA 1d bar on 2024-06-10 has a bogus high | Scan candles; avoid high-based indicators across that date |
| A walk-forward can report `finished` with null OOS metrics (not seen in Sep 2026 runs) | Inspect the child backtests |
| PositionStatus / last_profit pair scoping is verified in backtests only, not live | Check live/demo behaviour yourself |

## Looks like an engine bug, but isn't

These are worth knowing because they look like engine bugs:

- A status-2 run read as "finished with 0 trades".
- `indicator/Latch` with `serviceName:"indicator"`, which causes time-limit failures.
- A "Links in these blocks are incorrect" rejection caused by stale inputs that formed a cycle.
- "ADX changed", which was a stored row that had never been re-run.
- C16 rerun differences, which came from an intentional ADX correction.
