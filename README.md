# TradeBuilder - Engineered Risk Strategy

Trade Plan Defaults:
users defines their risk tolerance of up to 2% of their account balance and their target buffer of 75 to 80%.
the user defines their income objective/trading purpose. will the High Time Frame (HTF) be less than or equal to the daily time frame or greater than or equal to the weekly time frame to establish a stop buffer of either 2 or 10%.

pre-steps:
input asset daily ATR
input account balance

Six-Step Process Flowchart: trade builder takes basic input the user identifies from the chart using trade methodology in six steps
  1) Set the Curve on the HTF: identify high time frame supply and demand zones using the five step zoning process and using the distal lines, divides the area into thirds to define the curve; retail, equalibrium, and wholesale price ranges.
  2) Check the Trend on the Intermediary Time Frame (ITF): the user identifies the trend; Uptrend, Sideways trend, or Downtrend.
  3) Identify Zones on the Low Time Frame (LTF) using the five-step zoning process: user inputs the proximal and distal lines of the supply and demand zones.

     Steps 1, 2 & 3 combined, determine the trade objective whether to buy long or sell short based on a Decision Matrix.
     ******
     a) a supply zone high on the curve in a downtrend = Sell Short. 

     b) a supply zone high on the curve in a sideways trend = Sell Short. 

     c) a supply zone high on the curve in an uptrend = Sell Short ONLY if the profit zone score is greater than or equal to 5:1. 
     ******
     d) a demand zone high on the curve in a downtrend = No trade. 

     e) a demand zone high on the curve in a sideways trend = No trade. 

     f) a demand zone high on the curve in an uptrend = Buy Long ONLY if the profit zone score is equal to or greater than 5:1. 
     ******
     g) a supply zone in the middle of the curve in a downtrend = Sell Short. 

     h) a supply zone in the middle of the curve in a sideways trend = Sell Short. 

     i) a supply zone in the middle of the curve in an uptrend = No trade. 
     ******
     j) a demand zone in the middle of the curve in a downtrend = No trade. 

     k) a demand zone in the middle of the curve in a sideways trend = Buy Long. 

     l) a demand zone in the middle of the curve in an uptrend = Buy Long. 
     ******
     m) a supply zone low on the curve in a downtrend = Sell Short ONLY if the profit zone score is equal to or greater than 5:1. 

     n) a supply zone low on the curve in a sideways trend = No trade. 

     o) a supply zone low on the curve in an uptrend = No trade. 
     ******
     p) a demand zone low on the curve in a downtrend = Buy Long ONLY if the profit zone score is equal to or greater than 5:1. 

     q) a demand zone low on the curve in a sideways trend = Buy Long. 

     r) a demand zone low on the curve in an uptrend = Buy Long.
     ******
  4) Score the Trade using the Odds Enhancers: present the odds enhancer scorecard

     a) Strength 	2, 1, or 0 	points	(how did price leave the zone? user must determine from chart).

     b) Time		1, 0.5, or 0 points	(how much time did price spend at the zone? user must determine from chart).

     c) Freshness	2, 1, or 0	points	(has price returned to the zone? user must determine from chart).

     d) Trend		2, 1, or 0 	points	(scored automatically based on identified trend and trade objective. buying long in an uptrend, 2 points. buying long in a sideways trend, 1 point. buying long in a downtrend, 0 points. reverse for selling short.

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
     
			a) show position size, # of shares (according to trade risk and max risk per trade)
						
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
