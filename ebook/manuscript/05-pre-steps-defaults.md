# Pre-steps: the trade plan defaults

> **Status:** outline

Four numbers are set before any chart is opened. They do not change trade to
trade.

## Must cover

### Account balance

- [ ] What counts as the balance for sizing purposes (available, not notional).
- [ ] Why every risk limit in the strategy is a percentage of this one figure.
- [ ] Running example: **$600**.

### Risk tolerance — up to 2%

- [ ] Max account risk per trade = balance × 2%.
- [ ] Worked: $600 × 0.02 = **$12**. Trade risk per share × shares must not
      exceed $12.
- [ ] 2% is a ceiling, not a target. A smaller figure is allowed; larger is not.

### Income objective and the stop buffer

- [ ] The question: is the HTF at or below daily, or at or above weekly?
- [ ] Daily income or lower → stop buffer = ATR × **2%**.
- [ ] Weekly income or greater → stop buffer = ATR × **10%**.
- [ ] This single choice is the only thing the income objective controls.

### Target buffer — 75% to 80%

- [ ] Definition: the fraction of the profit zone captured before exiting.
- [ ] Long: (supply proximal − demand proximal) × 0.75, added to demand proximal.
- [ ] Short: the same distance × 0.75, subtracted from supply proximal.
- [ ] Keep between 75% and 80% unless using a mechanical 3:1 target instead.
- [ ] Why you exit *before* the opposing zone rather than into it.

### Daily ATR

- [ ] What ATR is: average true range, a 14-day moving average of volatility.
- [ ] Where to get it: finviz.com → ticker in the top-left → the figures below
      the candlestick chart → **ATR** on the far right.
- [ ] Running example: NVDA, ATR = **5.93**.
- [ ] It is a running average and changes day to day — re-read it before sizing.

## Worked example

- [ ] ATR 5.93 × 2% = 0.1186 → **always round up** → a **$0.12** stop buffer.
- [ ] That $0.12 goes *behind* the distal line: subtracted from a demand distal,
      added to a supply distal.

## Notes

The rounding rule matters and is easy to lose: always round the stop buffer up.
Rounding down shaves the stop and quietly raises the real risk per share.
