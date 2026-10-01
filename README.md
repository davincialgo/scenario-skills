# ArrowAlgo Scenario Skills

These are agent skills for building, backtesting and **honestly validating** trading strategies on [Arrow Algo](https://arrowalgo.com) with an AI assistant (Claude, ChatGPT/Codex, Gemini, Grok, or any MCP-compatible agent).

Arrow Algo lets an AI build a strategy as a visual node graph (a *scenario*), backtest it, and run it live, with every order placed by Arrow Algo's own engine. These skills teach the AI how to do that well. They distil six months of research: about 1,200 replays, hundreds of platform backtests and 13 strategy families. Most of the lessons came from things that went wrong:
- headline returns that didn't survive re-checking;
- graph bugs that looked like strategy results;
- "platform bugs" that turned out to be our own bookkeeping.

## What's inside

| Skill | Your AI uses it when… |
|---|---|
| [`building-arrowalgo-scenarios`](skills/building-arrowalgo-scenarios/SKILL.md) | Creating or editing scenario graphs: nodes, links, conditions, position state, variables, limit orders, JavaScript blocks. Includes a graph validator. |
| [`running-arrowalgo-backtests`](skills/running-arrowalgo-backtests/SKILL.md) | Launching and reading backtests or walk-forwards, and working out whether a strange result is the graph or the platform. |
| [`validating-trading-strategies`](skills/validating-trading-strategies/SKILL.md) | Deciding whether a strategy is actually good: benchmarks, costs, out-of-sample tests, robustness gates, and a quick go/no-go checklist. |
| [`arrowalgo-strategy-case-studies`](skills/arrowalgo-strategy-case-studies/SKILL.md) | Starting a new idea. Covers what has already worked and failed (trend following, pyramiding, mean reversion, limit entries, stops, leverage), with importable example scenarios. |

## Quick start

### 1. Create an Arrow Algo account

Sign up at **[arrowalgo.com](https://arrowalgo.com)**. You can build and backtest without connecting an exchange. You only need exchange API keys to trade live, and you add those in the Arrow Algo app; they are never shared with the AI.

### 2. Connect your AI to Arrow Algo (MCP)

The Arrow Algo MCP server URL is:

```
https://app.arrowalgo.com/mcp/
```

Sign-in uses OAuth with your own Arrow Algo account. You never paste a password or API key into the AI.

| Client | How to connect |
|---|---|
| **Claude.ai** (web/desktop) | Customize → Connectors → **+** → *Add custom connector* → paste the URL → Connect and sign in |
| **Claude Code** | `claude mcp add --transport http arrowalgo https://app.arrowalgo.com/mcp/`, then run `/mcp` inside `claude` to sign in |
| **Codex** | `codex mcp add arrowalgo --url https://app.arrowalgo.com/mcp/`, then `codex mcp login arrowalgo` |
| **Gemini CLI** | `gemini mcp add --transport http arrowalgo https://app.arrowalgo.com/mcp/`, then `/mcp auth arrowalgo` |
| **Grok / ChatGPT** | Add a custom connector with the URL above. See [arrowalgo.com/#mcp](https://arrowalgo.com/#mcp) for step-by-step instructions |

### 3. Install the skills

**Claude Code: as a plugin**

```
/plugin marketplace add davincialgo/scenario-skills
/plugin install arrowalgo-scenario-skills@arrowalgo-scenario-skills
```

**Claude Code: by hand**

```bash
git clone https://github.com/davincialgo/scenario-skills.git
cp -r scenario-skills/skills/* ~/.claude/skills/        # or <your-project>/.claude/skills/
```

**Claude.ai.** Zip each folder under `skills/` (for example `building-arrowalgo-scenarios.zip`), then upload it under Settings → Capabilities → Skills.

**Other agents** (Codex, Gemini CLI, and anything else that reads `SKILL.md` files). Copy the folders under `skills/` into that agent's skills directory. If your agent has no skills support, paste the relevant `SKILL.md` into its project instructions (`AGENTS.md`, `GEMINI.md`…).

### 4. Ask your AI

With the connector and the skills both active, try:

- *"Build a BTC daily trend scenario on Binance futures: long above the 200-day SMA, flat below. Validate the graph, then backtest it from 2018 to today."*
- *"Backtest my scenario 'My Strategy' over rolling 12-month windows since 2019 and tell me honestly whether it beats buy-and-hold after costs."*
- *"My backtest says +180% but annualizedReturn is 18000. What's going on, and should I trust it?"*
- *"I want to add a 3% stop-loss to this strategy. Test it properly, without fooling ourselves."*
- *"Has anyone tried buying support with limit orders? Start me from an example scenario."*

The AI loads the matching skill automatically from your request.

## Example scenarios

[`skills/arrowalgo-strategy-case-studies/examples/`](skills/arrowalgo-strategy-case-studies/examples/README.md) contains ready-to-import graphs. Some are verified: an SMA200 regime baseline, the V80 BTC 4h trend pyramid, a V85 risk-control variant, and a support-retest limit strategy. There is also a deliberately buggy graph for teaching. A few are reconstructed and marked **unverified**. Ask your AI to *"create a scenario from examples/sma200-regime.json and backtest it"*.

## Graph validator

This is a dependency-free Node script that catches the graph mistakes we kept making: stale links, cycles, wrong service names, single-input conditions, unpaired variables, slash-formatted pairs, unscoped position blocks, and more.

```bash
node skills/building-arrowalgo-scenarios/validate-graph.js my-graph.json
node skills/building-arrowalgo-scenarios/validate-graph.js fetched.json --to-submit   # convert a fetched graph back to submit format
node --test skills/building-arrowalgo-scenarios/validate-graph.test.js
```

## Important

- **Not financial advice.** These are research notes and tooling. Most of the strategies documented here *failed*, and that is the point. Backtests, even honest ones, overstate live results. Trading involves risk of loss, especially with leverage.
- Platform behaviour is recorded as of **2026-09-30**. Known fixed and open issues are in [`platform-status.md`](skills/running-arrowalgo-backtests/platform-status.md). Re-check older notes before relying on them.
- Use of Arrow Algo is subject to its [terms of service](https://arrowalgo.com/terms-of-service/).

## Contributing

Found a new trap, a fixed platform issue, or a strategy result that holds up under the validation checklist? Open an issue or PR. Please include the evidence: the backtest window, the warmup, costs, and the benchmark.
