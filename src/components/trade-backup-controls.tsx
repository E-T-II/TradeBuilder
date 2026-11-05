"use client";

import { useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Download, FolderArchive, Upload, X } from "lucide-react";
import type { FormState, TradeLogEntry } from "@/components/trade-builder-app";
import {
  createTradeBackup,
  MAX_BACKUP_BYTES,
  parseTradeBackup,
  type TradeBackup,
} from "@/lib/trade-backup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-provider";

interface TradeBackupControlsProps {
  form: FormState;
  tradeLog: TradeLogEntry[];
  onRestore: (backup: TradeBackup) => void;
}

export function TradeBackupControls({ form, tradeLog, onRestore }: TradeBackupControlsProps) {
  const { text: tx } = useLanguage();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<TradeBackup | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [reading, setReading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const selection = useRef(0);

  const changeOpen = (next: boolean) => {
    selection.current++;
    setOpen(next);
    setPreview(null);
    setError("");
    setStatus("");
    setReading(false);
    setConfirmed(false);
  };

  const download = () => {
    setError("");
    setStatus("");
    try {
      const text = createTradeBackup(form, tradeLog);
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `tradebuilder-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setStatus("Backup download started. Keep the file somewhere safe.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The backup could not be downloaded.");
    }
  };

  const readFile = async (file: File | undefined) => {
    const request = ++selection.current;
    setPreview(null);
    setConfirmed(false);
    setError("");
    setStatus("");
    setReading(false);
    if (!file) return;
    setReading(true);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("The backup exceeds the 10 MB size limit.");
      const backup = parseTradeBackup(await file.text());
      if (request === selection.current) setPreview(backup);
    } catch (cause) {
      if (request === selection.current) {
        setError(cause instanceof Error ? cause.message : "The selected file could not be read.");
      }
    } finally {
      if (request === selection.current) setReading(false);
    }
  };

  const restore = () => {
    if (!preview || !confirmed) return;
    setError("");
    try {
      onRestore(preview);
      setPreview(null);
      setConfirmed(false);
      setStatus("Backup restored. Your form and trade log have been replaced.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The backup could not be restored.");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger render={<Button variant="ghost" size="sm" aria-label={tx("Backup and restore")} />}>
        <FolderArchive aria-hidden />
        <span className="hidden sm:inline">{tx("Backup")}</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(34rem,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-lg outline-none">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Dialog.Title className="font-medium">{tx("Backup and restore")}</Dialog.Title>
            <Dialog.Close render={<Button variant="ghost" size="icon-sm" aria-label={tx("Close backup dialog")} />}>
              <X aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-sm text-muted-foreground">{tx("Save your current form and entire trade log, including setup snapshots and closing details. Files stay on your device and are not uploaded.")}</Dialog.Description>
          <div className="mt-5 space-y-5">
            <section className="space-y-2" aria-labelledby="export-backup-title">
              <h3 id="export-backup-title" className="text-sm font-medium">{tx("Export backup")}</h3>
              <p className="text-xs text-muted-foreground">{tx("Includes {0} logged trades and your account balance. The file is not encrypted; store it privately. Theme and temporary screen preferences are not included.", [tx(tradeLog.length)])}</p>
              <Button variant="outline" onClick={download}>
                <Download aria-hidden />{tx("Download backup")}</Button>
            </section>
            <section className="space-y-3 border-t pt-4" aria-labelledby="restore-backup-title">
              <h3 id="restore-backup-title" className="text-sm font-medium">{tx("Restore backup")}</h3>
              <label className="block space-y-2 text-sm">
                <span>{tx("Choose a backup file (.json, up to 10 MB)")}</span>
                <Input
                  type="file"
                  accept=".json,application/json"
                  onChange={(event) => {
                    void readFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
              {reading ? <p role="status" className="text-sm">{tx("Checking backup...")}</p> : null}
              {preview ? (
                <div className="space-y-3 rounded-lg border p-3 text-sm">
                  <h4 className="font-medium">{tx("Backup preview")}</h4>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                    <dt>{tx("Exported")}</dt><dd>{tx(new Date(preview.exportedAt).toLocaleString())}</dd>
                    <dt>{tx("Form ticker")}</dt><dd className="break-all">{preview.form.ticker || tx("Blank form")}</dd>
                    <dt>{tx("Trades")}</dt><dd>{tx(preview.tradeLog.length)} {tx("total,")} {preview.tradeLog.filter((entry) => entry.isOpen).length} {tx("open")}</dd>
                  </dl>
                  <p className="text-muted-foreground">{tx("This will replace your current form ({0}) and all {1} logged trades. Nothing is merged. Download a backup of your current data first if you want to keep it.", [form.ticker || tx("no ticker"), tx(tradeLog.length)])}</p>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 shrink-0 accent-primary"
                      checked={confirmed}
                      onChange={(event) => setConfirmed(event.target.checked)}
                    />{tx("I understand this replaces my current form and entire trade log.")}</label>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={!confirmed} onClick={restore}>
                      <Upload aria-hidden />{tx("Replace data and restore")}</Button>
                    <Button variant="outline" onClick={() => {
                      setPreview(null);
                      setConfirmed(false);
                      setError("");
                    }}>{tx("Cancel restore")}</Button>
                  </div>
                </div>
              ) : null}
            </section>
            {error ? <p role="alert" className="text-sm text-destructive">{tx(error)}</p> : null}
            {status ? <p role="status" className="text-sm">{tx(status)}</p> : null}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
