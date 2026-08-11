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
