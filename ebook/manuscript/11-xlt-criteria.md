# XLT Criteria

> **Status:** drafted

The Decision Matrix chooses the direction and identifies whether the setup is
standard, aggressive, or a pass. XLT criteria decide whether the zone itself is
good enough to trade. A matrix-approved cell is not permission to deploy
capital until these chart checks are complete.

The app calculates the curve, trend, profit-zone score, and risk math. Zone
freshness, departure quality, the quality of the base, the arrival into the
zone, and nearby structure are chart-reading decisions that the trader must
verify.

## Conservative XLT setups

### Long: demand low on the curve, downtrend

This is a long entry against the ITF downtrend. Retail participants can see a
falling market; the XLT case is that unfilled institutional demand remains at
the zone.

- The LTF demand zone must be fresh and untested.
- Price must have left the base rapidly and decisively, with strong bullish
  departure candles indicating imbalance.
- The nearest fresh LTF supply zone must leave a clear path for a profit-zone
  score of at least **3:1**.
- Price should return to demand impulsively. Slow, choppy, or consolidating
  arrival weakens the setup and invalidates the XLT case.
- Place a passive buy limit at the demand proximal line. Set the protective
  stop below the demand distal line, including the strategy's ATR buffer.

### Short: supply high on the curve, uptrend

This is a short entry against the ITF uptrend. The XLT case is that retail
buying reaches a fresh institutional supply zone.

- The LTF supply zone should be a clean drop-base-drop or rally-base-drop
  formation: a tight base of no more than three or four candles, followed by a
  decisive drop.
- Confirm that intervening pivots are weak or exhausted so price has a clear
  path toward the opposing demand area.
- Look for retail buying pressure or a breakout trap into the supply zone that
  institutional sell orders can absorb.
- The nearest fresh LTF demand zone must leave a clear path for a profit-zone
  score of at least **3:1**.
- Place a passive sell limit at the supply proximal line. Set the protective
  buy stop above the supply distal line, including the strategy's ATR buffer.

## Aggressive XLT setups

Aggressive setups occur at the hostile end of the higher-timeframe curve. They
require both a fresh, high-quality zone and a profit-zone score of at least
**5:1**. A score below 5:1 is an automatic pass.

### Long: demand high on the curve, uptrend

The ITF is bullish, but the asset is already expensive near higher-timeframe
supply. Do not use a passive limit order. Wait for price to enter the demand
zone, fail to continue lower, and confirm with a bullish reversal out of the
zone before entering.

### Short: supply low on the curve, downtrend

The ITF is bearish, but the asset is already cheap near higher-timeframe
demand. Require a confirmation entry and an unusually clear path to the first
opposing fresh demand zone. If that zone is reached before a 5:1 profit-zone
score is available, pass on the trade.

## Equilibrium continuation setups

At equilibrium, the ITF trend is the directional guide. These are standard
trend-continuation plays, provided the zone is fresh and the path to the
opposing zone supports at least a **3:1** profit-zone score.

- Demand in equilibrium with an ITF uptrend: buy at the demand proximal line.
- Supply in equilibrium with an ITF downtrend: sell at the supply proximal
  line.

## Absolute passes

The matrix protects capital by refusing structurally hostile combinations.
Two clear examples are demand high on the curve in a downtrend and supply low
on the curve in an uptrend. Do not override a pass with a high odds-enhancer
score or a compelling-looking candle pattern.

## XLT summary

| Scenario | Curve / trend / zone | Entry | Minimum profit-zone score |
|---|---|---|---|
| Conservative long | Low / downtrend / demand | Passive limit at proximal | 3:1 |
| Aggressive long | High / uptrend / demand | Confirmation only | 5:1 |
| Continuation long | Equilibrium / uptrend / demand | Passive limit at proximal | 3:1 |
| Conservative short | High / uptrend / supply | Passive limit at proximal | 3:1 |
| Aggressive short | Low / downtrend / supply | Confirmation only | 5:1 |
| Continuation short | Equilibrium / downtrend / supply | Passive limit at proximal | 3:1 |

The matrix thresholds are implemented in `decisionMatrix()` in
`src/lib/trade-builder.ts`. The manual XLT checks above remain mandatory even
when that function approves the setup.