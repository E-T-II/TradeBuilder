import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount rendered components after each test so the DOM doesn't leak between
// cases (a leaked render breaks negative assertions in later tests).
afterEach(() => {
  cleanup();
});
