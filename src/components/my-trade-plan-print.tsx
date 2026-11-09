"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/components/language-provider";
import { TradePlanGraphic } from "@/components/trade-plan-graphic";
import {
  ANALYSIS_COLUMNS, EMERGENCY_CONTACT_FIELDS, formatPlanSectionTitle, formatScheduleTime, PLAN_GRAPHICS,
  RISK_PARAMETERS, RISK_PARAMETER_MARKETS, RISK_PART_TWO_RULES, RISK_RULES,
  TRADING_PURPOSES, type GoalRow, type MyTradePlan,
} from "@/lib/my-trade-plan";

const DOCUMENT_TITLES: Record<number, string> = {
  1: "My Trading Purpose",
  2: "My Strengths",
  3: "My Areas of Improvement",
  4: "My Income Goals",
  5: "My Wealth Goals",
  6: "Markets I Trade",
  7: "My Trading and Investing Accounts",
};

const INTRODUCTIONS: Record<number, string> = {
  1: "My purpose (My Why) for learning to trade is more important than trading itself. Trading is simply the means to help me realize my “Why”.",
  2: "Certain character traits are important to have to learn how to trade.",
  3: "Certain character traits will keep me from achieving my goals. Being aware of these will help me manage them and improve my approach.",
  4: "My objective is to establish realistic goals with regards to my training and investing opportunities. This will help me to stay focused on managing my risk and reward.",
  5: "My objective is to establish realistic goals with regards to my training and investing opportunities. This will help me to stay focused on managing my risk and reward.",
  6: "I want to truly be diversified in my trading activity; therefore I will be trading:",
  8: "Multiple timeframe analysis is critical for navigating through the Blueprint steps when planning and executing trades.",
  9: "Having defined rules for entering a trade helps to keep my trading rule-based and unemotional. Following contains the rules and conditions for each type of entry I will use when trading.",
  10: "Managing my risk is one of the most important keys to being able to trade with skill and confidence. My rules for how to exit a trade when the trade is not going in my favor are as follows.",
  11: "Knowing when to exit a trade is directly related to whether the trade will be profitable or not. The following are my rules to help me achieve a profitable exit.",
  13: "Placing the order of a trade must be checked and double checked. There is a set process I go through when placing a trade.",
  14: "It is critical to list the rules that I will actively follow in managing my risk.",
  15: "It is critical to list the rules that I will actively follow in managing my risk.",
  16: "Once my trade has met entry and begins to move in my favor, I will begin moving my Stop Loss Order to lock in any profits.",
  17: "It is critical that I list the rules that I will actively follow to manage my risk.",
  18: "Being aware of when market reports are published is critical to being prepared for possible shifts in price action.",
  19: "Logging Trades is critical to helping me stay disciplined with my trading and help me learn from my mistakes and identify what helps meet my goals.",
  20: "I will make sure to not only keep the data results of each trade, but I will also take screen shots with notes. In addition I commit to keeping notes on each trade regarding my feelings, impressions and what I learned from the trade.",
  21: "The following helps me plan out my “day-in-the-life” or week or month of my time as a trader/investor. I will treat my schedule regimen as a work day and commit to consistently executing my plan on a regular consistent basis.",
  22: "I must always be ready for emergency situations with contingency plans and the appropriate emergency contact information to quickly address any issue that may arise.",
};

function cssContent(text: string) {
  return `"${text.replace(/\s+/g, " ").replaceAll("\\", "\\\\").replaceAll('"', '\\"')
    .replaceAll("\0", "").replaceAll("<", "\\3c ").replaceAll(">", "\\3e ")}"`;
}

export function MyTradePlanPrint({ plan, titles }: { plan: MyTradePlan; titles: readonly string[] }) {
  const { text: tx, language } = useLanguage();
  const value = (text: string) => text || "—";
  const choice = (text: string) => text ? tx(text) : "—";
  const note = (text: string) => text.trim() ? <div className="worksheet-notes">
    <p>{text}</p>
  </div> : null;
  function table(headers: readonly string[], rows: ReactNode[][]) {
    return <table><thead><tr>{headers.map((header) =>
      <th key={header} scope="col">{tx(header)}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
    </table>;
  }
  function goals(rows: GoalRow[]) {
    return list(rows.filter((row) => row.amount || row.period || row.market).map((row) =>
      tx("{0} increase per {1} trading {2}.", [
        `${row.unit}${row.amount}` || "—", choice(row.period), choice(row.market),
      ])));
  }
  function list(items: ReactNode[]) {
    return items.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>—</p>;
  }
  function checklist(items: string[]) {
    return list(items.map((item) => tx(item)));
  }
  const sections: ReactNode[] = [
    <div key="cover" className="worksheet-cover-content">
      <h1>{plan.title.trim() ? plan.title : tx("My Trade Plan")}</h1>
      {plan.author.trim() ? <p className="worksheet-cover-author">{plan.author}</p> : null}
      <dl className="worksheet-cover-details">
        {plan.version.trim() ? <div><dt>{tx("Version #")}</dt><dd>{plan.version}</dd></div> : null}
        {plan.currencySymbol.trim() ? <div><dt>{tx("Currency symbol")}</dt><dd>{plan.currencySymbol}</dd></div> : null}
      </dl>
    </div>,
    <p key="why">{value(plan.why)}</p>,
    <div key="strengths">
      {!plan.strengthNotesOnly && checklist(plan.strengths)}
      {note(plan.strengthNotes)}
    </div>,
    <div key="improvements">
      {!plan.improvementNotesOnly && checklist(plan.improvements)}
      {note(plan.improvementNotes)}
    </div>,
    <div key="income">
      {!plan.incomeNotesOnly && goals(plan.incomeGoals)}
      {note(plan.incomeNotes)}
    </div>,
    <div key="wealth">
      {!plan.wealthNotesOnly && goals(plan.wealthGoals)}
      {note(plan.wealthNotes)}
    </div>,
    <div key="markets">
      {!plan.marketNotesOnly && list(plan.markets.filter((row) => row.assetClass || row.watchListRules)
        .map((row) => <><strong>{choice(row.assetClass)}</strong>{row.watchListRules ? <> — {row.watchListRules}</> : null}</>))}
      {note(plan.marketNotes)}
    </div>,
    <div key="accounts">
      {!plan.accountNotesOnly && list(plan.accounts.filter((row) => row.type || row.broker || row.amount)
        .map((row) => tx("{0} account with {1} containing {2}.", [
          choice(row.type), choice(row.broker), row.amount ? `${plan.currencySymbol || "$"}${row.amount}` : "—",
        ])))}
      {note(plan.accountNotes)}
    </div>,
    table(["Trading Purpose", ...ANALYSIS_COLUMNS], plan.timeframes.map((row, index) =>
      [tx(TRADING_PURPOSES[index]), ...row.map(choice)])),
    <div key="entries">
      {!plan.entryNotesOnly && list(plan.entries.filter((row) => row.tradeType || row.entryRules)
        .map((row) => <><strong>{choice(row.tradeType)}</strong>{row.entryRules ? <> — {row.entryRules}</> : null}</>))}
      {note(plan.entryNotes)}
    </div>,
    <div key="stop">
      {!plan.stopNotesOnly && <>
        <p>{tx("The Stop Loss should be placed beyond the Distal line using a Buffer Margin of:")}</p>
        {list([
          tx("{0}% of Daily ATR for {1}.", [value(plan.stopIncomeBuffer), tx("Income Trades")]),
          tx("{0}% of Daily ATR for {1}.", [value(plan.stopWealthBuffer), tx("Wealth Trades")]),
        ])}
      </>}
      {note(plan.stopNotes)}
    </div>,
    <div key="targets">
      {!plan.targetNotesOnly && list(plan.targetRules.filter((row) => row.purpose || row.buffer || row.timeframe)
        .map((row) => tx("For {0}, the target is placed {1}% before the first opposing {2} zone.", [
          choice(row.purpose), value(row.buffer), choice(row.timeframe),
        ])))}
      {note(plan.targetNotes)}
    </div>,
    <div key="graphics">{PLAN_GRAPHICS.filter(({ id }) => plan.graphics[id].included).map((graphic) =>
      <figure key={graphic.id}>
        <p>{plan.graphics[graphic.id].precedingParagraph}</p>
        <figcaption>{tx(graphic.title)}</figcaption>
        <TradePlanGraphic id={graphic.id} title={graphic.title} />
      </figure>)}</div>,
    <div key="orders">{list(plan.placingOrderRules.filter((rule) => rule.trim()))}</div>,
    <ul key="risk-one">{RISK_RULES.filter(({ id }) => plan.riskRules.includes(id)).map((rule) =>
      <li key={rule.id}>
        {tx(rule.text)}
        {rule.id === "rewardRatio" && <> {value(plan.riskRewardRatio)} {tx("to my 1st target.")}</>}
        {rule.id === "singleTrade" && <> {value(plan.singleTradeRisk)} {tx("% of my trading account for any single trade.")}</>}
        {rule.id === "multipleTrades" && <> {value(plan.multipleTradeRisk)} {tx("% of my account.")}</>}
      </li>)}</ul>,
    <div key="risk-two">
      {!plan.riskPartTwoNotesOnly && checklist(RISK_PART_TWO_RULES.filter((rule) => plan.riskPartTwoRules.includes(rule)))}
      {note(plan.riskPartTwoNotes)}
    </div>,
    <div key="management">
      {!plan.managementNotesOnly && <>
        <p>{tx("Move the stop to BREAK EVEN once the trade has reached")} {value(plan.breakEvenRatio)} {tx("in my favor")}</p>
        <p>{tx("Move stop to lock in any profits every time a new Supply Zone (Short Trades), or Demand Zone (Long Trades) is formed in the")} {choice(plan.managementTimeframe)} {tx("zone, after trade has met entry")}</p>
      </>}
      {note(plan.managementNotes)}
    </div>,
    table(["Risk Parameters", ...RISK_PARAMETER_MARKETS], plan.riskParameters.map((row, index) => [
      tx(RISK_PARAMETERS[index]), ...row.map((cell) => index === RISK_PARAMETERS.length - 1 ? choice(cell) : `$${value(cell)}`),
    ])),
    <div key="reports">{list(plan.reports.filter((row) => row.source || row.notes)
      .map((row) => <><strong>{choice(row.source)}</strong>{row.notes ? <> — {row.notes}</> : null}</>))}</div>,
    <div key="logging">
      <p>{tx("Every closed trade will be logged in")} {choice(plan.tradeLogDestination)}</p>
      <p>{tx("Trades will be logged")} {choice(plan.tradeLogSchedule)} {tx("after the trade has closed.")}</p>
    </div>,
    <div key="review">
      {note(plan.reviewNotes)}
    </div>,
    <div key="schedule">
      {!plan.scheduleNotesOnly && list(plan.schedules.filter((row) => Object.values(row).some(Boolean))
        .map((row) => tx("I will devote {0} hours per {1} from {2} to {3} to trade {4} for {5}.", [
          value(row.hours), choice(row.period), value(formatScheduleTime(row.start, language)),
          value(formatScheduleTime(row.end, language)), choice(row.market), choice(row.purpose),
        ])))}
      {note(plan.scheduleNotes)}
    </div>,
    <div key="contacts">
      {table(EMERGENCY_CONTACT_FIELDS.map(({ label }) => label),
        plan.emergencyContacts.map((row) => EMERGENCY_CONTACT_FIELDS.map(({ key }) =>
          key === "website" || key === "phone" ? <bdi key={key} dir="ltr">{value(row[key])}</bdi> : value(row[key]))))}
    </div>,
  ];

  const pageNumber = tx("Page {0} of {1}").split(/(\{[01]\})/).map((part) =>
    part === "{0}" ? "counter(page)" : part === "{1}" ? "counter(pages)" : cssContent(part)).join(" ");

  return <article className="my-trade-plan-print" aria-label={tx("Printable trading plan")}
    lang={language} dir={language === "ar" || language === "he" ? "rtl" : "ltr"}>
    <style>{`@page my-trading-plan {
      @top-right { content: ${cssContent(plan.title.trim() ? plan.title : tx("My Trade Plan"))}; }
      @bottom-center { content: ${cssContent([plan.author, plan.version ? `${tx("Version #")} ${plan.version}` : ""].filter((text) => text.trim()).join(" | "))} "\\a "
        ${cssContent(tx("Provided for educational purposes. Users are responsible for all their trading choices."))} "\\a "
        ${pageNumber}; }
    }`}</style>
    {sections.map((section, index) => <section key={titles[index]} data-plan-page={index + 1}
      className={index === 0 ? "worksheet-cover" : index === 22 ? "worksheet-appendix" : undefined}>
      {index > 0 ? <>
        <h2>{formatPlanSectionTitle(index, tx(DOCUMENT_TITLES[index] || titles[index]))}</h2>
        {INTRODUCTIONS[index] ? <p className="worksheet-introduction">{tx(INTRODUCTIONS[index])}</p> : null}
      </> : null}
      {section}
    </section>)}
  </article>;
}
