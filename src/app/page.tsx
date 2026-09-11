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

import { TradeBuilderApp } from "@/components/trade-builder-app";
import { DISCLAIMER } from "@/lib/copy";

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col">
      <TradeBuilderApp />
      <footer className="hidden px-5 py-4 text-center text-xs text-muted-foreground lg:block lg:border-t lg:px-8">
        {DISCLAIMER}
      </footer>
    </main>
  );
}
