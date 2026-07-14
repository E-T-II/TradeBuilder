import { TradeBuilderApp } from "@/components/trade-builder-app";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Trade Builder
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Score a trade opportunity with the odds enhancer scorecard, then get
          your entry, stop loss, target and position size — engineered around
          strict risk management.
        </p>
      </header>
      <TradeBuilderApp />
      <footer className="mt-10 border-t pt-4 text-xs text-muted-foreground">
        For education only — not financial advice. Based on the Engineered
        Risk Trading Strategy.
      </footer>
    </main>
  );
}
