# Step 6 — Place the order and log the trade

> **Status:** outline

## Must cover

### Which order type

- [ ] **Proximal entry** → a limit order at the entry zone proximal line.
- [ ] **Confirmation entry** → a stop limit order $0.10 beyond the proximal
      line: above a demand proximal, below a supply proximal.
- [ ] The reasoning behind confirmation: you are waiting for price to enter the
      zone past the proximal line and then cross back out of it, confirming the
      zone held before you commit.

### Placing it

- [ ] Enter the stop, entry, target and size with the broker.
- [ ] Set the stop and target at the same time as the entry, not afterwards.
- [ ] What to do if the fill differs from the planned entry.

### Logging

- [ ] Log every trade, including the score that justified it.
- [ ] On a completed order, select **Log trade** to save the trade in the app.
- [ ] Each logged entry records the date and time, ticker, direction, entry,
      stop, target, position size, capital requirement, total trade risk,
      reward:risk, and odds-enhancer total.
- [ ] The Trade log is stored only in the browser on the device being used. It
      remains when the current trade is reset, but it is not shared between
      browsers or devices and can be lost when browser site data is cleared.
- [ ] Use **Delete logged trade** to remove one entry, or **Clear log** to
      remove the complete local log.
- [ ] Why the log matters: it is the only way to find out whether your judged
      scores — strength, time, freshness — are honest.
- [ ] Reviewing the log: look for scores you inflated to clear the 7-point bar.

### Copying results

- [ ] Select **Copy results** to copy the completed trade as a tab-separated
      row that can be pasted into a spreadsheet or external journal.
- [ ] The export includes ticker, all six enhancer scores, total score, Decision
      Matrix direction, stop, entry, target, position size, order type, capital
      requirement, risk per share, total trade risk, and reward:risk.
- [ ] A blank ticker exports as **Unknown** so external records are not left
      without an asset identifier.

## Notes

The app's results screen supports both a local Trade log and a tab-separated
Copy results export. The local log is convenient for review; use the copied
export as the durable record outside the browser.
