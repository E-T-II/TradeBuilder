import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

// Node 25 ships its own unbacked Web Storage global that shadows jsdom's, so
// `localStorage.setItem`/`clear` throw. Install a deterministic in-memory
// localStorage so the suite behaves the same on any Node version.
beforeAll(() => {
  const store = new Map<string, string>();
  const mock: Storage = {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => void store.set(key, String(value)),
    removeItem: (key) => void store.delete(key),
    clear: () => store.clear(),
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
  const define = (target: object) =>
    Object.defineProperty(target, "localStorage", {
      value: mock,
      configurable: true,
      writable: true,
    });
  define(globalThis);
  if (typeof window !== "undefined") define(window);
});

// Unmount rendered components after each test so the DOM doesn't leak between
// cases (a leaked render breaks negative assertions in later tests).
afterEach(() => {
  cleanup();
});
