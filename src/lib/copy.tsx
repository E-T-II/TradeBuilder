/*
 * Copyright (C) 2026 [e.t.ii aka genoTrades]
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://gnu.org>.
 */

// Shared so the wording stays in sync across the footer and the wizard.
const disclaimerPrefix = "For education only, not financial advice. Based on the ";
const strategyTitle = "Engineered Risk Trading Strategy";
export const DISCLAIMER =
  `${disclaimerPrefix}${strategyTitle}.`;

export function Disclaimer() {
  return (
    <>
      {disclaimerPrefix}
      <a
        href="/engineered-risk-trading-strategy.pdf"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-foreground"
      >
        {strategyTitle}
        <span className="sr-only"> (PDF, opens in a new tab)</span>
      </a>
      .
    </>
  );
}
