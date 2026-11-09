# TradeBuilder - Engineered Risk Strategy

Trade Builder helps traders engineer the trade before risking capital. It converts market structure, supply and demand, trend, zone quality and account risk into a rules-based trade plan—then calculates the stop, entry, target and position size or rejects the setup when it fails to meet the strategy’s requirements. The key distinction is that it is not a trade-prediction or brokerage-execution tool. It is a decision-support and rule-enforcement system designed to promote consistency, discipline and measurable risk.

Logged trades can be marked closed and given an exact signed **Profit/Loss** and a **Closing date**. Exit price and optional total fees are available under **Advanced details**. Realized P&L uses the entered Profit/Loss when provided; otherwise it uses the planned entry and share count, less fees. Each completed trade displays its Profit/Loss directly in the log, whether entered manually or calculated from exit price and fees. The log also summarizes completed trades overall. The **Ave P&L ratio** divides the average winning trade by the average losing trade, each rounded to the cent, and shows the result to two decimals (for example, $29.13 ÷ $12.15 = 2.40:1); breakeven trades are excluded, and it reads "No losing trades yet" until a loss is recorded. Trades and these outcome details remain in the current browser's local storage.

Select **P&L Analysis** beside **Realized performance** to open the monthly calendar. Each trading day shows its combined realized P&L and trade count, grouped by Closing date. Green indicates profit, red indicates loss, and darker shading indicates a larger daily amount relative to other days in that month. Non-trading days and breakeven days have no fill; breakeven days still show their amount and trade count. Navigate past months with the arrows or month picker, or use **Today** to return to the current month. Future months cannot be selected. Completed outcomes without a valid Closing date are excluded from the calendar and counted in a notice; open trades and trades without a recorded outcome are not included.

Optional **actual opening date**, **actual opening price**, and **actual shares** remain available under **Advanced details** for your trading journal. These fields are retained in backups and the printable trade log. They do not change the Realized performance summary or the P&L calendar.

The **Engineered Risk Trading Strategy** link in the education-only disclaimer opens the included strategy PDF in a new tab without leaving the current setup.

### My Trade Plan worksheet

Click the footer's **Page N of 23** control to open a compact searchable page picker. Search by a translated title or an exact page number, then select a result to jump without losing edits. Page numbers have their own column, titles wrap, and the current page is highlighted. Use arrow keys and Enter to select, or Escape to close and return focus to the control. **Previous** and **Next** remain available.

On the income and wealth goals pages, **+ Add** adds another goal row. Use the trashcan icon on a goal's row to delete it. At least one row must remain on each page; its delete button is disabled when it is the only row. **Use notes only** beside **Additional Notes** saves an independent preference without hiding or clearing the goal rows. Changes save with the rest of the worksheet.

On the markets page, each row pairs **Asset Class** with **Market Watch List Rules**. Use **+ Add** for additional markets or a row's trashcan to remove it; at least one row remains. **Use notes only** beside the additional market considerations saves a separate preference without clearing market selections or rules. Older saved asset-class selections are retained as the first market row.

The accounts page starts with two account listings. Use **+ Add** to add more or a row's trashcan to remove it; at least one row remains. Extra trailing empty rows beyond the first two are removed when loading a saved plan; entered accounts are preserved. **Use notes only** beside **Additional account information** saves an independent preference without hiding or clearing account entries.

On page 10, **+ Add** adds a trade-type and entry-rules row. Each row has a trashcan; at least one row remains. Saved rules from older plans are retained in the first row. **Use notes only** beside **Additional considerations for rules of entry** saves an independent preference without hiding or clearing the trade types or entry rules.

Select **Create my trade plan** (book icon) above **Ticker symbol** in Pre-steps to open a twenty-three-page planning document. Each page displays its title. Use **Previous** and **Next** to navigate between document information, motivation, strengths, improvement areas, income and wealth goals, markets, accounts, multiple-timeframe analysis, entry rules, stop-loss rules, target-exit rules, execution graphics, placing-order rules, risk-management rules, trade management, checking reports, logging rules, reviewing results, scheduling, and emergency contacts. Checklist selections, dropdowns, and written responses are retained between pages and when the dialog is closed.

Page 11 records separate Income and Wealth Trade stop-loss buffers as percentages of Daily ATR, with additional considerations and an independent **Use notes only** preference. These worksheet values do not change the trade builder's calculations.

Page 12 records target-exit rules with a selectable Income Trades or Wealth Trades purpose and a percentage buffer before the first opposing LTF, ITF, or HTF zone. One **+ Add** button below the table adds a row; trashcans remove rows, retaining at least one. Previously saved rules retain their purposes and values. Additional target-exit considerations include an independent **Use notes only** preference. These values save with the worksheet and do not change the trade builder's calculations.

Page 13 lists Trade Blueprint Steps, Trade Blueprint Flow Chart, 6-Step Trading Process, and Decision Matrix with thumbnails. Each graphic has an inclusion checkbox and an independent **Preceding Paragraph** field. Selections and paragraphs save locally; unchecking a graphic does not clear its paragraph. Selected graphics and their preceding paragraphs are included in the printed plan.

Page 14 records placing-order rules in text boxes. **+ Add** adds a rule and each row's trashcan removes it, retaining at least one row. Rules save with the worksheet; older plans start with one blank rule.

Page 15 records eight independent Risk Management Part 1 checkboxes, a minimum reward ratio from 10:1 to 1:1, and numeric risk percentages for single and simultaneous trades. Unchecking a rule preserves its entered values. Older plans start unchecked with blank values. These worksheet preferences do not change the builder's risk limits or calculations.

Page 16 records five independent Risk Management Part 2 checkboxes covering entry orders, diversification, broker-held orders, backups, and trade reviews. **Additional risk management considerations** includes a saved **Use notes only** preference without hiding or clearing checkbox selections. Selections and notes save independently from Part 1; older plans start unchecked with blank notes.

Page 17 records the reward ratio for moving the stop to break even (10:1 through 1:1) and the timeframe for trailing stops behind new supply/demand zones (LTF, ITF, HTF). **Additional trade management considerations** includes an independent **Use notes only** preference without hiding or clearing the dropdowns. Older plans start with blank selections and notes. These rules do not change trade calculations.

Page 18 records Maximum Risk Parameters for Stocks, Futures, Forex, Options, and Crypto. The first eight rows use nonnegative numeric dollar fields, including the opened-trade limit rows as requested; the final row records independent Yes/No weekend-holding choices. All 45 cells save locally, and older plans start with a blank table. These worksheet values do not change calculations or enforce trading limits. A wider popup, compact fields, and fixed column proportions fit all five markets on desktop screens; the table scrolls horizontally on phones.

Page 19 pairs **Report Name** dropdowns with **Report Notes and Purpose** text boxes. **+ Add** adds a report and each row's trashcan removes it, retaining at least one row. All eleven source options, including **Other**, are available on every row; custom report details can be written in the notes. Website names and saved selections remain unchanged when switching language. Older plans start with one blank report.

Page 20 records where closed trades will be logged (Trade Builder logs or a personal trade log) and when (immediately, twice a day, end of day, or end of week). Both dropdowns save independently and start blank for older plans. These are planning preferences only: they do not automatically log trades or schedule reminders.

Page 21 describes reviewing trade data, screenshots, feelings, and lessons learned, with a saved **Additional considerations for reviewing results** notes box. Older plans start with blank notes.

Page 22 records repeatable schedule commitments: nonnegative hours per Day, Week, or Month; start/end times at every half hour from midnight through 11:30 pm; market; and Income or Wealth purpose. **+ Add** adds a blank row, and trashcans remove rows while retaining at least one. **Additional schedule and time considerations** includes an independent **Use notes only** preference without hiding or clearing the rows. Time labels follow the selected language while stored times remain in 24-hour format; overnight commitments are allowed. Older plans start with one blank row and blank notes. These are planning preferences, not scheduled tasks or trading restrictions.

Page 23, **Appendix A – Emergency Contact Reference Data**, records Purpose, Company Name, Website, Service Hours, Phone #, and Primary Contact. **+ Add** adds a contact with `http://` prefilled in Website; trashcans remove contacts while retaining at least one. All six fields save locally; older plans receive one blank contact with the same website default.

The magnifying-glass **Preview** button opposite every page title and the final **Finish and Download** button both open the browser's Print dialog for the complete plan. Choose **Save as PDF** to download it. The output follows the selected language, includes checked rules and graphics, and honors each **Use notes only** preference by omitting that section's structured fields without clearing the saved entries. All 23 sections are included; long notes, tables, or graphics can span extra printed pages. The worksheet remains open after printing or cancelling. Printing uses the latest in-memory edits, including unsaved edits if browser storage fails; it does not confirm that a PDF was saved.

The output is a document rather than a copy of the worksheet: a centered cover with the saved title, author, version, and currency; flowing narrative sections with bold headings and introductions; bulleted goals, accounts, execution rules, reports, and schedule commitments; and tables for timeframe analysis, risk parameters, and emergency contacts. Empty notes and unused repeatable rows are omitted, while partially completed entries remain. It uses US Letter paper with one-inch margins. In browsers supporting page-margin boxes, every physical page has the saved plan title at the top right above a full-width horizontal line, plus a centered footer with the saved author and version, the disclaimer "Provided for educational purposes. Users are responsible for all their trading choices.", and "Page x of xx" numbering using the actual printed page count. These labels and the disclaimer follow the selected language. Browser-owned headers and footers can be disabled in the print dialog to avoid duplicate date/URL details. The cover and emergency-contact appendix start separately; the remaining sections flow naturally instead of forcing one page per worksheet step. No sample-document personal information or third-party branding is inserted.

The entire worksheet follows the selected interface language, including page descriptions, controls, choices, navigation, validation messages, and the four rebuilt execution diagrams. Arabic and Hebrew use right-to-left worksheet layout without mirroring diagram geometry. Translations are bundled locally and machine-generated; native-speaker review is still needed. User-entered text, saved choice values, and numeric rules are not translated or changed. Its currency symbol labels account amounts in this document only; it does not convert amounts or change the builder's USD calculations. Dollar/percent goal choices are independent for each row.

Changes save locally in the current browser under a separate storage key. The worksheet is **not included in trade backups** and can be lost when browser data is cleared. Read or save failures are displayed with a retry action; unsaved edits remain in memory until the app is reloaded. Account and emergency contact information is not encrypted. Do not enter credentials or account numbers.

### Interface language

Use **Language** in the header to choose English, Arabic, Bengali, Dutch, French, German, Hebrew, Hindi, Indonesian, Italian, Japanese, Korean, Malayalam, Polish, Portuguese, Punjabi, Russian, Spanish, Tamil, Telugu, or Ukrainian. The preference is saved locally in this browser, separate from trade data, and is not included in backups.

Every page displays a notice in the selected language that translations still need native-speaker review, except when English is selected.

### Display currencies

Use the **Display currency** (banknote) button in the header to select USD (default), EUR, GBP, CAD, AUD, JPY, CHF, CNY, INR, MXN, BRL, KRW, ILS, IDR, PLN, UAH, BDT, PKR, AED, or SAR independently of language.

- All inputs, risk/position calculations, and recorded trade amounts remain **USD**. Non-USD displays add clearly marked approximate conversions alongside the original USD amount; they are not executable order prices.
- Daily reference rates are fetched from [Frankfurter's public API](https://frankfurter.dev/), with no API key. Only currency codes are requested, never trade/account data; requests omit credentials and the page referrer. These are reference estimates, not live forex quotes or broker rates, and exclude exchange spreads and conversion fees.
- Rates and the display preference are cached locally. Selecting a non-USD currency fetches rates if its cache is absent or outdated; **Refresh rates** explicitly updates them. A checked rate expires after 24 hours, and a reference date at least three days old is marked outdated. Offline failures are shown explicitly; a cached rate may still be used with an outdated warning, or a **Manual rate** can be entered as units of the selected currency per 1 USD. Manual overrides persist until explicitly refreshed.
- Each newly logged trade stores its selected currency, rate, reference date, check timestamp, and source. Its conversions stay fixed at that **logging-time** rate, including after closure, rate refresh, language/currency changes, reload, printing, and backup/restore. This is not the broker's execution-time conversion. Older trades and trades logged without an available rate remain in USD; historical rates are not invented or backfilled.
- Journal and calendar totals use individual saved rates only when every included trade has a rate for the currently selected currency. Otherwise totals remain in USD; individual trades retain their saved display currency. P&L ratios, win rates, and calendar profit/loss coloring always use USD outcomes.
- Backups include per-trade rates but not the current display preference or rate cache. Currency interface copy is bundled for all supported languages in [src/lib/currency-translations.ts](./src/lib/currency-translations.ts); it also needs native-speaker review.

Changing languages translates application labels, instructions, dialogs, validation and storage messages, accessibility labels, and printable reports. Calendar month and weekday names follow the selected language. Arabic and Hebrew use right-to-left layout. Trading calculations, USD amounts, ticker symbols, notes, and saved trade inputs are unchanged.

The main interface catalogs are machine-generated using a locally run NLLB translation model. Additional odds-enhancer illustration translations are bundled locally; neither has been reviewed by native speakers. No application text or trade data is sent to a translation service, and translation does not require a network connection. All supported languages translate odds-enhancer illustration text while preserving the English candle, panel, and selection coordinates, including text overlays on all eight Demand / Supply screenshots. Translated wording is fitted within the original text bounds; Arabic and Hebrew use right-to-left text without mirroring charts. The included strategy PDF remains English. YouTube content and browser-owned file/print controls depend on their own language support.

When adding interface copy, use `useLanguage().text(...)` and update the English source catalog and every translated catalog in [src/lib/locales](./src/lib/locales). Keep interpolation placeholders such as `{0}` and numeric trading rules unchanged. Localization tests check catalog completeness, placeholders, numeric thresholds, real translated forms, and right-to-left switching.

All four YouTube tutorials request the selected language for player controls and caption preferences. Caption availability depends on YouTube and the video; this does not turn captions on automatically. **The app cannot force a dubbed audio track**. In each video's **Settings > Audio track**, choose the desired language if that track is available. Changing languages does not change trade calculations, stored inputs, or notes.

### Review and print a trade plan

On the results screen, select **Print / save plan** to open the browser's print dialog. Print the plan or choose **Save as PDF** to download it. The plan includes the setup assumptions, score breakdown, Decision Matrix verdict, order details when an order qualifies, and risk-check outcomes. Rejected setups are also exportable, with the reason no order was produced. Review the plan and confirm current prices and conditions before placing any order.

Select **Print / Save PDF** in the **Trade log** header to print your trading journal or save it as a PDF through the browser's print dialog. The journal includes all open and closed trades, setup prices and sizing, Closing date, Profit/Loss, optional execution details, and notes. Missing details do not prevent printing. It summarizes completed outcomes using the same P&L values as Realized performance.

### Backup and restore

Use **Backup** in the header from any step or the results screen:

- **Download backup** saves a versioned JSON file containing the current form and the entire trade log, including open/closed status, exit prices, fees, and saved setup snapshots. Theme and temporary screen preferences are not included.
- To move to another browser or device, transfer the file yourself and choose it under **Restore backup**. Files are processed locally, not uploaded; no account or cloud sync is required.
- Restore validates the whole file before showing its export date, form ticker, and trade counts. Invalid JSON, unsupported versions, malformed data, duplicate trade IDs, and files over 10 MB are rejected without changing existing data. Incomplete in-progress forms are supported.
- Check the replacement acknowledgement, then select **Replace data and restore**. This replaces both the current form and entire log; it does not merge trades. Cancel leaves your data unchanged. Download your current data first if you want to keep it.
- A successful restore saves both datasets in browser storage and returns to Pre-steps. The optional auto-fill open-risk toggle is turned off so the imported form's risk value is preserved. If saving the log fails, the previous saved form is restored and an error is shown instead of reporting success.

Backups contain account balances and trade history and are **not encrypted**. Store them privately. A printed or PDF trade log is not a restorable backup.

Step 5 of 5 (Score) keeps the entry-zone odds enhancer scorecard on the left and adds a target-zone scorecard on the right (side by side at screen widths of 480px and above; stacked entry-first on narrower phones). Both use the same graphical selectors for Strength, Time, and Freshness. Trend, Curve, and Profit zone are automatically scored for each zone: the target zone is supply for a long trade and demand for a short trade. Target ratings are optional, saved with the setup and logged setup snapshots, and do not affect orders, risk checks, printed trade logs, or logged trade scores. Older saves start with unanswered target ratings.

For XLT setups, Step 5 provides a scenario-specific checklist button that opens a popup of chart observations the scorecard cannot assess. Checklist progress is preserved when the popup is closed and reopened. All items must be checked before viewing the trade. Step 4 (Zones) does not require this checklist. Changing curve, trend, direction, or zone prices clears the checks.

The circled **i** beside Trend, Curve, and Profit zone on both Step 5 scorecards opens a reference screenshot showing the Best, Good, and Poor scoring criteria. Both scorecards also have a circled **i** beside Total score, showing the proximal, confirmation, and no-trade entry examples. All four references use a Demand / Buy / Long or Supply / Sell / Short photo matching the card's zone, whether it is the entry or target zone, and update when the trade direction changes. The photos ship without their original orange markers; instead, the card draws an orange dashed box, an orange checkmark, and an orange heading on the option that matches the zone's calculated score (the Total score card follows the 8.5 / 7 entry-type thresholds). Nothing is highlighted until that score can be calculated. These cards are informational only: they do not accept selections or change scores. Close them with the close button, Escape, or by clicking outside the card.

The scorecard's translated Score and Max headings extend left as needed to stay on one line without moving the number boxes or score columns. On very narrow screens, the Odds Enhancer heading uses smaller text.

The Profit zone row also shows the calculated reward-to-zone ratio (for example, `Ratio 6.00:1`, rounded down to two decimals) once the curve and zone prices are valid. The Total score row shows the resulting entry type (Proximal, Confirmation, or No Trade) once Strength, Time, and Freshness are all rated. Both update as the inputs change.

If the entry zone's total is below 7 out of 10 (70%), Step 5 shows an **Unqualified Entry Zone** alert and the **See my trade** button stays disabled until the zones are re-scored at 7 or above. The target zone's score is for comparison only and never blocks continuing.

The direction-switch button on Step 5 swaps Entry and Target roles and their Strength, Time, and Freshness ratings, including unanswered ratings, without changing supply or demand prices. Card colors and automatic scores follow the new direction, which also updates Step 4. Trade outputs continue to use the Entry scorecard. Switching clears XLT verification; if the new entry ratings are unanswered, they must be completed before viewing the trade. Switching again restores the previous direction and ratings.

Trade Plan Defaults:
users define their risk tolerance of up to 2% of their account balance and their target buffer of 75 to 80%.
the user defines their income objective/trading purpose. will the High Time Frame (HTF) be less than or equal to the daily time frame or greater than or equal to the weekly time frame to establish a stop buffer of either 2 or 10%.

pre-steps:

input  ticker symbol, asset daily ATR and account balance

Six-Step Process Flowchart: trade builder takes basic input the user identifies from the chart using trade methodology in six steps
  1) Set the Curve on the HTF: identify high time frame supply and demand zones using the five step zoning process and using the distal lines, divides the area into thirds to define the curve; retail, equalibrium, and wholesale price ranges.
  2) Check the Trend on the Intermediary Time Frame (ITF): the user identifies the trend; Uptrend, Sideways trend, or Downtrend.
  3) Identify Zones on the Low Time Frame (LTF) using the five-step zoning process: user inputs the proximal and distal lines of the supply and demand zones.

     Steps 1, 2 & 3 combined, determine the trade objective whether to buy long or sell short based on a Decision Matrix.
     ******
     a) a supply zone high on the curve in a downtrend = Sell Short. 

     b) a supply zone high on the curve in a sideways trend = Sell Short. 

     c) a supply zone high on the curve in an uptrend = Sell Short ONLY if the profit zone score is equal to or greater than 3:1 and meets XLT criteria. 
     ******
     d) a demand zone high on the curve in a downtrend = No trade. 

     e) a demand zone high on the curve in a sideways trend = No trade. 

     f) a demand zone high on the curve in an uptrend = Buy Long ONLY if the profit zone score is equal to or greater than 5:1 and meets XLT criteria.
     ******
     g) a supply zone in the middle of the curve in a downtrend = Sell Short. 

     h) a supply zone in the middle of the curve in a sideways trend = Sell Short. 

     i) a supply zone in the middle of the curve in an uptrend = No trade. 
     ******
     j) a demand zone in the middle of the curve in a downtrend = No trade. 

     k) a demand zone in the middle of the curve in a sideways trend = Buy Long. 

     l) a demand zone in the middle of the curve in an uptrend = Buy Long. 
     ******
     m) a supply zone low on the curve in a downtrend = Sell Short ONLY if the profit zone score is equal to or greater than 5:1 and meets XLT criteria. 

     n) a supply zone low on the curve in a sideways trend = No trade. 

     o) a supply zone low on the curve in an uptrend = No trade. 
     ******
     p) a demand zone low on the curve in a downtrend = Buy Long ONLY if the profit zone score is equal to or greater than 3:1 and meets XLT criteria. 

     q) a demand zone low on the curve in a sideways trend = Buy Long. 

     r) a demand zone low on the curve in an uptrend = Buy Long.
     ******

     XLT cells add only a profit zone requirement (3:1 or 5:1) and chart criteria. They never change the entry type: the odds enhancer score is taken at face value (8.5+ proximal, 7 to 8 confirmation, below 7 no trade), and the stop always uses the daily ATR buffer. Curve and trend are fixed by the cell, so the Scenario 1 cells (c and p) score at most 8 and can only be confirmation entries; the Scenario 2 cells (f and m) score at most 9.

     The Trade Builder automatically checks the entry scorecard requirements: strength = 2, freshness = 2, time at least 0.5, the scenario's minimum profit-zone ratio, and a total entry score of at least 7. It reports unmet scores directly. The opposing target zone's quality and intervening structures are judged by the trader; the app does not use a target-zone score to qualify or block the setup. The XLT checklist is only for chart observations the scorecard cannot assess.

      XLT Criteria - Scenario 1 (counter-trend reversal) | Scenario 2 (aggressive trend continuation)

         Checks shared by every XLT cell (verified from the chart before committing capital):

               1) Structural Quality & Imbalance: the LTF entry zone must be a clean Drop-Base-Drop or Rally-Base-Drop for a short (Rally-Base-Rally or Drop-Base-Rally for a long).

               2) Strength: a rapid, explosive move away from the base origin of at least 2:1 with breakout (3:1 is optimal) - full marks on the strength odds enhancer (move out AND breakout). A move out only or a breakout only disqualifies the setup.

               3) Time: a clean, tight base of no more than 3 to 4 tightly packed candles (1 to 2 is optimal). Score time as normal (1-3 candles = 1 point, 4-6 candles = 0.5), but a base of 5 or more candles disqualifies the setup.

               4) Freshness: the zone must be completely fresh and untested (full marks on the freshness enhancer). A retested zone invalidates the setup, potentially dissolving unfilled orders.

               5) Price Arrival: price must return to the zone in a strong impulsion phase (long leg candles). Slow, grinding, or choppy consolidated structures moving back toward the zone may invalidate the setup because they indicate structural institutional redistribution rather than a simple retest.

               6) Opposing Structures: the trader assesses intervening pivots between the entry zone and target as weak and chooses the nearest opposing zone judged to be quality. This may require reviewing several opposing zones. The app does not use the target zone's score to qualify or block the setup.

               7) Line Placement: the proximal line goes at the nearest candle body of the base (bottom of the lowest body for supply, top of the highest body for demand). The distal line goes at the extreme wick per the zone formation: a reversal formation (Rally-Base-Drop / Drop-Base-Rally) uses the extreme wick in the entire formation; a continuation formation (Drop-Base-Drop / Rally-Base-Rally) uses the extreme wick in the base or the leg out.

               8) Risk Parameters: the stop is placed safely behind the distal line, buffered by a percentage of the daily ATR per the HTF income objective (10% if the HTF is weekly or greater, 2% if daily or less). Every XLT setup keeps the baseline minimum 3:1 reward to risk: trade risk (entry to stop) must divide at least 3 times into the distance from entry to the target at the 75 to 80% target buffer (or a mechanical 3:1 target). If the target zone is hit before 3:1 is reached, the trade is disqualified.

         XLT Rule Variant: Short Trade - Scenario 1 (counter-trend reversal)
            LTF Zone: Supply | HTF Curve: Retail | ITF Trend: Uptrend

               1) Profit Zone Validation: the target area - the nearest opposing LTF demand zone you judge to be quality - must allow a move of at least 3:1 (profit zone enhancer earns at least 1 point). Because the ITF trend is up, assess minor pivots built on the way up to the supply zone and confirm they are weak. The app does not determine target-zone quality from its score.

               2) HTF Overlap: the curve is set from HTF zones, which is where the current trend is expected to end. Identify the LTF supply zone within (overlapping) a HTF zone. Under these circumstances scoring zero for trend is not much of an impact, but still respect the scorecard and wait for confirmation of a reversal.

               3) Execution Trigger: shorting in an uptrend in the retail range grants at most 8 points on the scorecard, so this can only be a confirmation trade of 7 to 8 points: a sell order 10 cents below the proximal line with the protective buy stop above the distal line per the ATR buffer.

         XLT Rule Variant: Short Trade - Scenario 2 (aggressive trend continuation)
            LTF Zone: Supply | HTF Curve: Wholesale | ITF Trend: Downtrend

               1) The market looks deeply bearish on the ITF chart but sits in the wholesale curve range, where proximity to actual HTF demand must be checked. Shorting a minor supply rally here risks an adverse reversal as price approaches or enters HTF demand.

               2) Profit Zone Validation: the available profit zone, measured zone to zone, must reach at least 5:1 (the profit zone enhancer must earn its full 2 points). If the first demand zone you judge to be quality is reached before 5:1 is available, the setup is ineligible per the Decision Matrix. Target-zone quality is the trader's judgment, not an app calculation.

               3) HTF Proximal Check: back out to the higher timeframe (per income objective and duration) and verify the HTF demand zone's proximal line location to ensure the 5:1 profit zone completes before price reaches it. If the HTF curve was set from a prominent high/low with no clean zone formation (no proximal line to check), pass and locate another opportunity with a valid HTF zone structure.

               4) Entry Location: the entry and the LTF zone's proximal line must be located in the wholesale curve range. A zone that straddles the boundary still counts as an XLT entry as long as the proximal line is within the wholesale range.

               5) Execution Trigger: entry type follows the odds enhancer score at face value (max 9): 8.5 to 9 proximal, 7 to 8 confirmation, below 7 no trade. On arrival, verify the return to the zone is not building fresh intervening demand zones that shrink the profit zone below 5:1; any structures it builds must score below 7.

         XLT Rule Variant: Long Trade - Scenario 1 (counter-trend reversal)
            LTF Zone: Demand | HTF Curve: Wholesale | ITF Trend: Downtrend

               Mirror of Short Trade Scenario 1. Profit zone of at least 3:1 to the nearest LTF supply zone you judge to be quality, all intervening pivots assessed as weak, and the LTF demand zone overlapping a HTF zone where the downtrend is expected to end. The app does not determine target-zone quality from its score. Buying in a downtrend in the wholesale range grants at most 8 points, so this can only be a confirmation trade of 7 to 8 points: a buy order 10 cents above the proximal line with the protective stop below the distal line per the ATR buffer.

         XLT Rule Variant: Long Trade - Scenario 2 (aggressive trend continuation)
            LTF Zone: Demand | HTF Curve: Retail | ITF Trend: Uptrend

               Mirror of Short Trade Scenario 2. You are opposite a Scenario 1 short seller at the same end of the curve: the ITF is bullish but the asset has expanded deep into HTF supply, so buying a minor demand pullback here risks an adverse reversal as price approaches or enters HTF supply. The profit zone must reach at least 5:1 before the first supply zone you judge to be quality; verify the HTF supply zone's proximal line leaves room for the 5:1 (no clean HTF proximal line = pass); the entry and proximal line must be located in the retail curve range. Entry type follows the scorecard at face value (max 9). The app does not use the target zone's score to qualify or block the setup.

  4) Score the Trade using the Odds Enhancers: present the odds enhancer scorecard

     a) Strength 	2, 1, or 0 	points	(how did price leave the zone? user must determine from chart).

     b) Time		1, 0.5, or 0 points	(how much time did price spend at the zone? user must determine from chart).

     c) Freshness	2, 1, or 0	points	(has price returned to the zone? user must determine from chart).

     d) Trend		2, 1, or 0 	points	(scored automatically based on identified trend and trade objective. buying long in an uptrend, 2 points. buying long in a sideways trend, 1 point. buying long in a downtrend, 0 points. reverse for selling short).
     
     e) Curve		1, 0.5, or 0	points	(how high or low is the zone located on the curve? if buying long in wholesale, 1 point. if buying long in equalibrium .5 points. if buying long in retail, 0 points. reverse for selling short).

     f) Profit Zone	2, 1, or 0 points	(how far is the opposing fresh zone? evaluates the height of the entry zone and measures how many times the entry zone divides into the distance between the entry zone proximal and the target zone proximal to establish the profit zone score. a profit zone score equal to or greater than 5:1 is 2 points. a score of greater than or equal to 3:1 is 1 point. less than 3:1 is 0 points).

     trade builder totals the score of the odds enhancers and presents the entry type; Proximal Entry = 8.5 to 10 points (very strong), Confirmation Entry = 7 to 8 points (strong), less than 7 points = No trade (weak)
     
  5) S.E.T.S. the Trade; trade builder presents the Stop, Entry, Target & Size of position

     Stop Loss Price

			a) show daily ATR
				
			b) show stop buffer %, 2 or 10 (based on HTF trade purpose)
				
			c) show stop buffer dollar amount (product of ATR and stop buffer %)
				
			d) show S.E.T.S. Stop Loss amount (result of stop buffer subtracted from LTF demand distal or added to LTF supply distal)

     Entry Price

			a) show S.E.T.S. Entry dollar amount (determined by odds enhancer total score)

     Target Price
	
			 a) show R:R ratio (based on trade risk, entry and preset target buffer %)
			
			 b) show target buffer %
			
			 c) show S.E.T.S. Target dollar amount (based on entry type and target buffer %)

     Size of Position
     
			a) show position size, # of shares (according to trade risk, max risk per trade, and account balance)
						
			b) show total risk per trade
				
			c) show capital requirement
     
  6) place the order with your broker & log your trade
 
if it is a proximal entry, a limit buy order is placed at the entry zone proximal line. 
if it is a confirmation entry, a stop limit buy order is placed $0.10 cents above a demand zone proximal line or $0.10 cents below a supply zone proximal line, anticipating price to enter the zone beyond the proximal line and then cross back beyond the proximal line leaving the zone.
the difference between the entry price and the stop loss establishes the risk on that trade.
the trade builder takes the risk on the trade and determines how many shares/contracts the user may purchase based on the users pre-defined risk tolerance of up to 2% of their account balance before determining the capital requirement.
if the captial requirement exceeds 50% of the users account balance the position size is automatically adjusted to meet this requirement.
the trade builder evaluates the profit zone (distance between entry zone proximal line and target zone proximal line) and sets a target to exit the trade based on the users pre-defined target buffer of 75 to 80%.
the trade builder informs the user of their Stop Loss price, Entry price, Sell limit price, and Size of their Position (S.E.T.S.) so the user may place the final order to their broker.

the trade builder is based on the following risk management rules contained in the Engineered Risk Trading Strategy

ENGINEERED RISK TRADING STRATEGY
(Deviation is not in the program. Don't do it!)

GENERAL RULES:  Never invest more than 50% of your account balance buying into one trade. Never risk (total risk per share) more than 6% of your account balance in multiple trades. If we did not score the trade, we will not take the trade. If we are angry, we will not trade. If we are excited and feeling good (cocky), we will not trade. Hope, fear, and greed is not a strategy. If your thought process is making decisions based on any of these three wasted opinions, check yourself and STOP! 

TARGET BUFFER: difference between demand proximal and supply proximal multiplied by 75% or .75 and added to the demand proximal line for long entry or subtracted from the supply proximal line for short entry. This serves as the target buffer and where we exit the trade to take profits. It is recommended to keep a percentage based target buffer between 75% and 80% unless using a mechanical R:R ratio of 3:1.

STOP BUFFER:  Daily Average True Range (ATR) multiplied by 2% or .02 = stop buffer for daily income or lower. If looking for weekly income or greater, multiply the ATR by 10% or .1
The ATR (market volatility over 14 day moving average) may be found at FINVIZ.com. Type in the ticker symbol in the upper left corner, scroll down to the numerical figures just below the candlestick chart where you will find “ATR” on the far-right side of the screen. Let’s take NVDA for example, if daily ATR = 5.93, multiply the ATR by 2% (daily income HTF or lower) or .02, which = 0.1186. Always round up when applicable, which comes to a $0.12 cent stop buffer. This means your Stop Loss would go $0.12 cents behind your Distal Line. Therefore, you would subtract $0.12 cents from the Distal Line of any Demand Zone and add $0.12 cents to the Distal Line of any Supply Zone. Keep in mind the ATR is a running average and will change day by day. 

TRADE RISK per Share:  the difference between the entry price and stop loss = trade risk per share.
For the upcoming examples and scenarios, let’s assume our trade risk is $0.50 cents and our account balance is $600.

REWARD-RISK-RATIO: the difference between entry price and target price divided by trade risk per share. Must be at least equal to or greater than 3:1.

MAX ACCOUNT RISK PER TRADE:  available account balance multiplied by 2% = max account risk
An account balance of $600 multiplied by 2% (.02) = $12 account risk. Meaning your trade risk per share multiplied by the number of shares you purchase should not exceed $12.

MAX ACCOUNT MULTIPLE TRADE RISK: account balance across all open positions multiplied by 6% = max acct. multiple trade risks.
	An account balance of $600 multiplied by 6% = $36. So, say you were involved in any number of trades. The total trade risk, which is the entry price minus the stop loss, multiplied by the number of shares for each open position should not exceed $36, per our example.

POSITION SIZE:  max account risk per trade divided by trade risk = position size.
	So, you take your max account risk of $12 and divide it by your $0.50 cent trade risk, which gives you 24. This means the maximum amount of shares you should buy is 24 shares. This is because the trade risk per share is $0.50 cents. A $0.50 cent risk per share (entry price to stop loss) multiplied by 24 shares is $12, which is equal to or less than 2% of your account size (max account risk).

CAPITAL REQUIREMENT: position size multiplied by entry price per share = capital requirement

ADJUSTED POSITION SIZE: 50% of account balance divided by entry price per share -OR- capital requirement divided by 50% of account balance, which = X, and then original Position Size divided by X (rounded down to nearest whole integer) = adjusted position size (to be used if capital requirement is greater than 50% of account balance). The second method to be used when the entry price is unknown.

Scenario 1
  Now, keeping the previously mentioned criteria in mind, let’s assume we want to buy Ford at $13.34 per share. Our Capital Requirement would be $320.16 for 24 shares ($13.34 multiplied by 24). However, our general rules state we never spend more than 50% of our account balance to invest in one trade. In this case our account balance is $600. This means we are $20.16 over 50% of our $600 account balance. You would need to adjust your position size down by 2 shares (2 shares at $13.34 ea. = $26.68) from the original 24 shares to 22 shares in order to take the trade. This would take our capital requirement from $320.16 to $293.48 and also give us a total trade risk of $11, which is less than $12, our Max Account Risk (2% of our account balance).

Scenario 2
	Now, let's say each share of Ford was $70 multiplied by our 24 share position size. This would bring our Capital Requirement to $1,680, which exceeds 50% of our account balance. You can determine the appropriate number of shares to purchase within our guidelines by dividing $1,680 by the dollar amount equal to 50% of your total account balance (in this case, $300). So, you take $1,680 and divide it by $300, which would come to 5.6. Now, take your original Position Size of 24 shares and divide it by 5.6. This will give you 4.28, which you round down to the nearest integer (ignore everything on the right side of the decimal), which gives you 4. Therefore, 4 is your newly adjusted Position Size, which satisfies our general rule of never using more than 50% of your account balance to invest. To verify your data, multiply 4 shares (your new position size) by the share price of our example, which is $70, and that should give you $280 which is less than 50% of our $600 account balance. This would give us a total trade risk of $2 ($0.50 cent risk per share multiplied by 4 shares), which is less than $12, our Max Account Risk (2% of our account balance).

Scenario 3
	Keeping Scenario 2 in mind, let’s say we decide we want to invest in Lucid as well, which is currently $26.26 per share. We have an entry at $24.66, and a stop at $24.45, which gives us a trade risk of $0.21 cents. In order to satisfy our general rules of never using more than 50% of our account balance, never risking more than 2% of our account on any one trade, and never risking more than 6% of our account balance, which in this case is $36 ($600 multiplied by 6% or .06) when taking multiple trades:

Lucid trade risk = $0.21 cents

Max account risk = $12

Max account multiple trade risk = $36

Position size = max account risk ($12) divided by trade risk ($0.21 cents) = 57.14 = 57 shares

57 (shares) multiplied by 24.66 (Lucid entry price) = $1,405.62 (capital requirement = Too High)

$1,405.62 divided by $300 (50% of account size) = 4.68

57 (shares, original position size) divided by 4.68 = 12.1794 (ignore everything right of decimal)

New position size = 12 shares

12 multiplied by $24.66 entry or share price = $295.92 (adjusted capital requirement)

12 multiplied by $0.21 = $2.52 (total trade risk for Lucid)

$2 (trade risk for Ford in Scenario 2) + $2.52 (trade risk for Lucid in scenario 3) = $4.52 (less than 6% of account balance = OK to take trade).
