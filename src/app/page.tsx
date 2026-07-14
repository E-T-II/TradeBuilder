import { TradeBuilderApp } from "@/components/trade-builder-app";

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col">
      <TradeBuilderApp />
      <footer className="border-t px-5 py-4 text-xs text-muted-foreground lg:px-8">
        For education only — not financial advice. Based on the Engineered
        Risk Trading Strategy.
      </footer>
    </main>
  );
}
