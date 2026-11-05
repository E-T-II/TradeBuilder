// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CurrencyProvider, useCurrency } from "@/components/currency-provider";
import { CurrencySelector } from "@/components/currency-selector";
import { LanguageProvider } from "@/components/language-provider";
import { CURRENCY_STORAGE_KEY, RATES_STORAGE_KEY, RATES_URL, type DisplayRate } from "@/lib/display-currency";
import { currencyText } from "@/lib/currency-translations";
import { LANGUAGES, LANGUAGE_STORAGE_KEY } from "@/lib/languages";

function Preview() {
  const { format } = useCurrency();
  return <output data-testid="preview">{format(100)}</output>;
}
function app() {
  return <LanguageProvider><CurrencyProvider><CurrencySelector /><Preview /></CurrencyProvider></LanguageProvider>;
}
const rate = (): DisplayRate => ({
  currency: "EUR", rate: 0.9, source: "Frankfurter",
  asOf: new Date().toISOString().slice(0, 10), checkedAt: new Date().toISOString(),
});
const response = (value = 0.9) => new Response(JSON.stringify([{ base: "USD", quote: "EUR", rate: value, date: rate().asOf }]));

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("defaults to USD without a network request, fetches on selection, and persists preference and cache", async () => {
  const fetcher = vi.fn().mockResolvedValue(response());
  vi.stubGlobal("fetch", fetcher);
  const user = userEvent.setup();
  const { unmount } = render(app());
  expect(screen.getByTestId("preview")).toHaveTextContent("$100.00");
  expect(fetcher).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Display currency" }));
  await user.selectOptions(screen.getByRole("combobox"), "EUR");
  await waitFor(() => expect(screen.getByTestId("preview")).toHaveTextContent("EUR 90.00"));
  expect(fetcher).toHaveBeenCalledWith(RATES_URL, expect.objectContaining({ credentials: "omit", referrerPolicy: "no-referrer" }));
  expect(window.localStorage.getItem(CURRENCY_STORAGE_KEY)).toBe("EUR");
  expect(JSON.parse(window.localStorage.getItem(RATES_STORAGE_KEY)!)[0]).toMatchObject({ currency: "EUR", rate: 0.9, source: "Frankfurter" });
  unmount();
  render(app());
  expect(screen.getByTestId("preview")).toHaveTextContent("EUR 90.00");
  expect(fetcher).toHaveBeenCalledOnce();
});

test("offline failure keeps a visibly marked cached rate and allows a manual override and retry", async () => {
  window.localStorage.setItem(CURRENCY_STORAGE_KEY, "EUR");
  window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify([{ ...rate(), checkedAt: "2020-01-01T00:00:00Z" }]));
  const fetcher = vi.fn().mockRejectedValue(new Error("Offline"));
  vi.stubGlobal("fetch", fetcher);
  const user = userEvent.setup();
  render(app());
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Rates could not be fetched"));
  expect(screen.getByTestId("preview")).toHaveTextContent("EUR 90.00");
  await user.click(screen.getByRole("button", { name: "Display currency" }));
  expect(screen.getByText("Cached rate; may be outdated.")).toBeVisible();
  await user.type(screen.getByRole("spinbutton"), "0.8");
  await user.click(screen.getByRole("button", { name: "Apply rate" }));
  expect(screen.getByTestId("preview")).toHaveTextContent("EUR 80.00");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem(RATES_STORAGE_KEY)!)[0].source).toBe("manual");
  fetcher.mockResolvedValue(response(0.7));
  await user.click(screen.getByRole("button", { name: "Refresh rates" }));
  await waitFor(() => expect(screen.getByTestId("preview")).toHaveTextContent("EUR 70.00"));
});

test("never relabels USD without a rate, rejects invalid manual rates and reports failed saves", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
  window.localStorage.setItem(CURRENCY_STORAGE_KEY, "EUR");
  const user = userEvent.setup();
  render(app());
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Rates could not be fetched"));
  expect(screen.getByTestId("preview")).toHaveTextContent("$100.00");
  expect(screen.getByTestId("preview")).not.toHaveTextContent("EUR");
  await user.click(screen.getByRole("button", { name: "Display currency" }));
  await user.type(screen.getByRole("spinbutton"), "-1");
  await user.click(screen.getByRole("button", { name: "Apply rate" }));
  expect(screen.getByRole("alert")).toHaveTextContent("positive, finite");
  vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("Denied"); });
  await user.selectOptions(screen.getByRole("combobox"), "GBP");
  expect(screen.getByRole("combobox")).toHaveValue("EUR");
  expect(screen.getByRole("alert")).toHaveTextContent("storage permissions");
});

test("invalid stored rates are surfaced without using them", async () => {
  window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify([{ ...rate(), rate: -1 }]));
  render(app());
  expect(screen.getByRole("alert")).toHaveTextContent("could not be read or saved");
  expect(screen.getByTestId("preview")).toHaveTextContent("$100.00");
});

test("switching to USD while a request is pending cannot apply an obsolete result", async () => {
  let resolve: ((value: Response) => void) | undefined;
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((done) => { resolve = done; })));
  const user = userEvent.setup();
  render(app());
  await user.click(screen.getByRole("button", { name: "Display currency" }));
  await user.selectOptions(screen.getByRole("combobox"), "EUR");
  expect(screen.getByText("Loading exchange rates…")).toBeInTheDocument();
  await user.selectOptions(screen.getByRole("combobox"), "USD");
  const resolveRequest = resolve;
  if (!resolveRequest) throw new Error("Expected a pending exchange-rate request.");
  await act(async () => { resolveRequest(response()); });
  await waitFor(() => expect(screen.getByTestId("preview")).toHaveTextContent("$100.00"));
  expect(screen.getByTestId("preview")).not.toHaveTextContent("EUR");
  expect(window.localStorage.getItem(RATES_STORAGE_KEY)).toBeNull();
});

test.each(LANGUAGES)("currency controls use $name without changing the selected currency", async ({ code }) => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  const user = userEvent.setup();
  render(app());
  await user.click(screen.getByRole("button", { name: currencyText(code, "title") }));
  expect(screen.getByRole("dialog")).toHaveAccessibleName(currencyText(code, "title"));
  expect(screen.getByText(currencyText(code, "description"))).toBeInTheDocument();
  expect(screen.getByRole("combobox")).toHaveValue("USD");
});
