import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SplashIntro } from "@/components/splash-intro";

// Plus Jakarta for UI (--font-sans), Geist Mono for numbers (--font-mono).
const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trade Builder",
  description:
    "Score a trade with the odds enhancer scorecard and get your entry, stop, target and position size based on the Engineered Risk Trading Strategy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
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
