// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TradeBackupControls } from "@/components/trade-backup-controls";
import { normalizeForm } from "@/components/trade-builder-app";
import { createTradeBackup, MAX_BACKUP_BYTES, parseTradeBackup } from "@/lib/trade-backup";

const form = normalizeForm({ ticker: "NVDA", accountBalance: "2500" });
const restoredForm = normalizeForm({ ticker: "AAPL", accountBalance: "4000" });

function backupFile(text = createTradeBackup(restoredForm, [])) {
  const file = new File([text], "backup.json", { type: "application/json" });
  Object.defineProperty(file, "text", { configurable: true, value: async () => text });
  return file;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("previews the backup and requires acknowledgement before replacement", async () => {
  const user = userEvent.setup();
  const onRestore = vi.fn();
  render(<TradeBackupControls form={form} tradeLog={[]} onRestore={onRestore} />);
  await user.click(screen.getByRole("button", { name: "Backup and restore" }));
  await user.upload(screen.getByLabelText(/Choose a backup file/), backupFile());
  expect(await screen.findByText("Backup preview")).toBeInTheDocument();
  expect(screen.getByText("AAPL")).toBeInTheDocument();
  expect(onRestore).not.toHaveBeenCalled();
  const restore = screen.getByRole("button", { name: "Replace data and restore" });
  expect(restore).toBeDisabled();
  await user.click(screen.getByRole("checkbox"));
  await user.click(restore);
  expect(onRestore).toHaveBeenCalledWith(expect.objectContaining({ form: restoredForm, tradeLog: [] }));
  expect(screen.getByRole("status")).toHaveTextContent("Backup restored");
});

test("canceling a restore leaves the current data unchanged", async () => {
  const user = userEvent.setup();
  const onRestore = vi.fn();
  render(<TradeBackupControls form={form} tradeLog={[]} onRestore={onRestore} />);
  await user.click(screen.getByRole("button", { name: "Backup and restore" }));
  await user.upload(screen.getByLabelText(/Choose a backup file/), backupFile());
  await screen.findByText("Backup preview");
  await user.click(screen.getByRole("button", { name: "Cancel restore" }));
  expect(screen.queryByText("Backup preview")).not.toBeInTheDocument();
  expect(onRestore).not.toHaveBeenCalled();
});

test("rejects invalid files with an error and no restore action", async () => {
  const user = userEvent.setup();
  const onRestore = vi.fn();
  render(<TradeBackupControls form={form} tradeLog={[]} onRestore={onRestore} />);
  await user.click(screen.getByRole("button", { name: "Backup and restore" }));
  await user.upload(screen.getByLabelText(/Choose a backup file/), backupFile("not JSON"));
  expect(await screen.findByRole("alert")).toHaveTextContent("not valid JSON");
  expect(screen.queryByRole("button", { name: "Replace data and restore" })).not.toBeInTheDocument();
  expect(onRestore).not.toHaveBeenCalled();
});

test("reports restore storage errors without success", async () => {
  const user = userEvent.setup();
  render(<TradeBackupControls form={form} tradeLog={[]} onRestore={() => {
    throw new Error("Storage full");
  }} />);
  await user.click(screen.getByRole("button", { name: "Backup and restore" }));
  await user.upload(screen.getByLabelText(/Choose a backup file/), backupFile());
  await screen.findByText("Backup preview");
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Replace data and restore" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Storage full");
  expect(screen.queryByText(/Backup restored/)).not.toBeInTheDocument();
});

test("checks file size before reading the file", async () => {
  const user = userEvent.setup();
  const file = backupFile();
  Object.defineProperty(file, "size", { value: MAX_BACKUP_BYTES + 1 });
  const read = vi.spyOn(file, "text");
  render(<TradeBackupControls form={form} tradeLog={[]} onRestore={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Backup and restore" }));
  await user.upload(screen.getByLabelText(/Choose a backup file/), file);
  expect(await screen.findByRole("alert")).toHaveTextContent("10 MB");
  expect(read).not.toHaveBeenCalled();
});

test("downloads a valid backup of the supplied form and log", async () => {
  const user = userEvent.setup();
  let blob: Blob | undefined;
  const createObjectURL = vi.fn((value: Blob) => {
    blob = value;
    return "blob:backup";
  });
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = createObjectURL;
    static revokeObjectURL = vi.fn();
  });
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  render(<TradeBackupControls form={form} tradeLog={[]} onRestore={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Backup and restore" }));
  await user.click(screen.getByRole("button", { name: "Download backup" }));
  expect(click).toHaveBeenCalledOnce();
  expect(blob).toBeDefined();
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsText(blob!);
  });
  expect(parseTradeBackup(text)).toMatchObject({ form, tradeLog: [] });
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Backup download started"));
});
