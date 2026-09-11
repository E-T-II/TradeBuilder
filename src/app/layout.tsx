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

import type { Metadata } from "next";
import "./globals.css";
import { SplashIntro } from "@/components/splash-intro";

export const metadata: Metadata = {
  title: "Trade Builder",
  description:
    "Score a trade with the odds enhancer scorecard and get your entry, stop, target and position size based on the Engineered Risk Trading Strategy.",
  icons: {
    icon: [
      { url: "/genoTrades.ico", sizes: "any", type: "image/x-icon" },
      { url: "/genoTrades.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/genoTrades.png",
  },
  openGraph: {
    title: "Trade Builder",
    description:
      "Score a trade with the odds enhancer scorecard and get your entry, stop, target and position size based on the Engineered Risk Trading Strategy.",
    images: [
      {
        url: "/genoTrades.png",
        width: 500,
        height: 500,
        alt: "Trade Builder preview",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Trade Builder",
    description:
      "Score a trade with the odds enhancer scorecard and get your entry, stop, target and position size based on the Engineered Risk Trading Strategy.",
    images: ["/genoTrades.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      {/* suppressHydrationWarning: the pre-paint scripts set the class/attr on
          <html>, and extensions mutate <body>, before hydration. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Inline, because Tailwind strips this rule from globals.css. */}
        <style
          dangerouslySetInnerHTML={{
            __html: "html[data-intro-done] .intro-splash{display:none!important}",
          }}
        />
        {/* Pre-paint: flag <html> so the style above hides the splash without a
            flash on repeat visits or reduced motion. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var d=sessionStorage.getItem('tradebuilder-intro-shown')==='1';}catch(e){var d=false;}var r=false;try{r=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}if(d||r){document.documentElement.setAttribute('data-intro-done','');}})();",
          }}
        />
        {/* Pre-paint: apply saved/OS theme so dark mode never flashes. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('tradebuilder-theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();",
          }}
        />
        <SplashIntro />
        {children}
      </body>
    </html>
  );
}
