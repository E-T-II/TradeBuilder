// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RootLayout from "./layout";

describe("RootLayout", () => {
    it("renders the app shell and children", () => {
        render(
            <RootLayout>
                <div>Trade content</div>
            </RootLayout>,
        );

        expect(screen.getByText("Trade content")).toBeInTheDocument();
        expect(document.documentElement.className).toContain("h-full");
        expect(document.documentElement.className).toContain("antialiased");
    });
});
