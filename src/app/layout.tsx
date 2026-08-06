import type { Metadata } from "next";
import "./globals.css";
import { SplashIntro } from "@/components/splash-intro";

export const metadata: Metadata = {
  title: "Trade Builder",
  description:
    "Score a trade with the odds enhancer scorecard and get your entry, stop, target and position size based on the Engineered Risk Trading Strategy.",
  icons: {
    icon: "/genoTrades.ico",
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
    images: ["/genoTrades2.png"],
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
