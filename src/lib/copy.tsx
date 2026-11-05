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

"use client";

import { useLanguage } from "@/components/language-provider";

// Shared so the wording stays in sync across the footer and the wizard.
const disclaimerPrefix = "For education only, not financial advice. Based on the ";
const strategyTitle = "Engineered Risk Trading Strategy";
export const DISCLAIMER =
  `${disclaimerPrefix}${strategyTitle}.`;

export function Disclaimer() {
  const { text: tx } = useLanguage();
  return (
    <>
      {tx(disclaimerPrefix)}
      <a
        href="/engineered-risk-trading-strategy.pdf"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-foreground"
      >
        {tx(strategyTitle)}
        <span className="sr-only">{tx("(PDF, opens in a new tab)")}</span>
      </a>
      .
    </>
  );
}
