# XLT Criteria

> **Status:** drafted

The Decision Matrix chooses the direction and identifies whether the setup is
standard, aggressive, or a pass. XLT criteria decide whether the zone itself is
good enough to trade. A matrix-approved cell is not permission to deploy
capital until these chart checks are complete.

XLT never changes the entry type. An XLT cell adds a minimum profit-zone score
(3:1 or 5:1) and the chart checks below; the odds-enhancer scorecard still
decides the order at face value, exactly as it does for every other setup:

- **8.5 – 10** → proximal entry (limit order at the proximal line).
- **7 – 8** → confirmation entry (10¢ before the proximal line).
- **Below 7** → no trade.

The stop is always the standard ATR buffer behind the distal line.

## Maximum possible score per XLT cell

Curve and trend are fixed by the matrix cell, so each XLT cell has a ceiling.
Profit zone (2), strength (2), time (1), and freshness (2) can add at most 7.

| Cell | Curve | Trend | Maximum score | Possible entries |
|---|---|---|---|---|
| Conservative long: demand, low on the curve, downtrend | 1 | 0 | **8** | Confirmation (7 – 8) only |
| Conservative short: supply, high on the curve, uptrend | 1 | 0 | **8** | Confirmation (7 – 8) only |
| Aggressive long: demand, high on the curve, uptrend | 0 | 2 | **9** | Proximal (8.5 – 9) or confirmation (7 – 8) |
| Aggressive short: supply, low on the curve, downtrend | 0 | 2 | **9** | Proximal (8.5 – 9) or confirmation (7 – 8) |

A conservative XLT trade fights the ITF trend, so it can never earn a
proximal entry. For example, shorting supply in the retail range of an
uptrend scores at most 8, so it can only be taken as a 7-to-8 confirmation
trade.

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
- Execution: the scorecard tops out at 8 here, so this is a **confirmation
  entry** (7 – 8) 10¢ above the demand proximal line, never a passive
  proximal limit. Set the protective stop below the demand distal line,
  including the strategy's ATR buffer.

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
- Execution: the scorecard tops out at 8 here, so this is a **confirmation
  entry** (7 – 8) 10¢ below the supply proximal line, never a passive
  proximal limit. Set the protective buy stop above the supply distal line,
  including the strategy's ATR buffer.

## Aggressive XLT setups

Aggressive setups occur at the hostile end of the higher-timeframe curve. They
require both a fresh, high-quality zone and a profit-zone score of at least
**5:1**. A score below 5:1 is an automatic pass.

### Long: demand high on the curve, uptrend

The ITF is bullish, but the asset is already expensive near higher-timeframe
supply. The profit-zone score must be at least **5:1**, with a clear path to
the first opposing fresh supply zone. Enter exactly as the scorecard says: a
proximal entry at 8.5 – 9, a confirmation entry 10¢ above the demand proximal
line at 7 – 8, and no trade below 7. The stop sits behind the demand distal
line by the standard ATR buffer.

### Short: supply low on the curve, downtrend

The ITF is bearish, but the asset is already cheap near higher-timeframe
demand. Require an unusually clear path to the first opposing fresh demand
zone, which must yield a profit-zone score of at least **5:1**. If that zone is
reached before 5:1 is available, pass on the trade. Enter exactly as the
scorecard says: a proximal entry at 8.5 – 9, a confirmation entry 10¢ below
the supply proximal line at 7 – 8, and no trade below 7. The stop sits behind
the supply distal line by the standard ATR buffer.

## Equilibrium continuation setups

At equilibrium, the ITF trend is the directional guide. These are standard
trend-continuation plays, provided the zone is fresh and the path to the
opposing zone supports at least a **3:1** profit-zone score. As always, the
scorecard sets the entry type.

- Demand in equilibrium with an ITF uptrend: buy long.
- Supply in equilibrium with an ITF downtrend: sell short.

## Absolute passes

The matrix protects capital by refusing structurally hostile combinations.
Two clear examples are demand high on the curve in a downtrend and supply low
on the curve in an uptrend. Do not override a pass with a high odds-enhancer
score or a compelling-looking candle pattern, and do not override the
scorecard's entry type in a cell the matrix allows.

## XLT summary

| Scenario | Curve / trend / zone | Max score | Entry (from the scorecard) | Minimum profit-zone score |
|---|---|---|---|---|
| Conservative long | Low / downtrend / demand | 8 | Confirmation (7 – 8) only | 3:1 |
| Aggressive long | High / uptrend / demand | 9 | Proximal (8.5+) or confirmation (7 – 8) | 5:1 |
| Continuation long | Equilibrium / uptrend / demand | 9.5 | Per scorecard | 3:1 |
| Conservative short | High / uptrend / supply | 8 | Confirmation (7 – 8) only | 3:1 |
| Aggressive short | Low / downtrend / supply | 9 | Proximal (8.5+) or confirmation (7 – 8) | 5:1 |
| Continuation short | Equilibrium / downtrend / supply | 9.5 | Per scorecard | 3:1 |

The matrix thresholds are implemented in `decisionMatrix()` in
`src/lib/trade-builder.ts`. The entry type always comes from `entryType()`
on the scorecard total. The manual XLT checks above remain mandatory even
when the matrix approves the setup.