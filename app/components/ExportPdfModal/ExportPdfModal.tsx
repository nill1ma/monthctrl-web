"use client";

import { SUPPORTED_CURRENCIES, getCurrencyFlag } from "@/app/lib/currency";
import type { ExportFilters } from "@/app/hooks/useExportMenuPdf/useExportMenuPdf";
import type { TransactionType } from "@/app/lib/pdf";
import { Dialog } from "@developmentsnil/awake-ui/dialog";
import { Button } from "@developmentsnil/awake-ui/button";
import { CircularProgress } from "@mui/material";
import { useState } from "react";
import { useIntl } from "react-intl";

type Props = {
  open: boolean;
  onClose: () => void;
  onExport: (filters: ExportFilters) => Promise<void>;
  isExporting: boolean;
  availableReferences: string[];
};

export function ExportPdfModal({ open, onClose, onExport, isExporting, availableReferences }: Props) {
  const { formatMessage } = useIntl();

  const sortedRefs = [...availableReferences].sort((a, b) => a.localeCompare(b));
  const minRef = sortedRefs[0] ?? "";
  const maxRef = sortedRefs[sortedRefs.length - 1] ?? "";

  const [referenceStart, setReferenceStart] = useState(minRef);
  const [referenceEnd, setReferenceEnd] = useState(maxRef);
  const [transactionType, setTransactionType] = useState<TransactionType>("all");
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);

  async function handleExport() {
    await onExport({
      referenceStart,
      referenceEnd,
      transactionType,
      currencies: selectedCurrencies.length > 0 ? selectedCurrencies : "all",
    });
    onClose();
  }

  function toggleCurrency(c: string) {
    setSelectedCurrencies((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  const TYPES: { value: TransactionType; labelId: string }[] = [
    { value: "all", labelId: "export.modal.type.all" },
    { value: "incoming", labelId: "export.modal.type.incoming" },
    { value: "expense", labelId: "export.modal.type.expense" },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 rounded-xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-5">

          <Dialog.Title className="text-lg font-semibold">
            {formatMessage({ id: "export.modal.title" })}
          </Dialog.Title>

          {/* Período — início */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              {formatMessage({ id: "export.modal.referenceStart" })}
            </label>
            <select
              value={referenceStart}
              onChange={(e) => setReferenceStart(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-transparent"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)", backgroundColor: "var(--color-surface)" }}
            >
              {sortedRefs.map((ref) => (
                <option key={ref} value={ref}>{ref}</option>
              ))}
            </select>
          </div>

          {/* Período — fim */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              {formatMessage({ id: "export.modal.referenceEnd" })}
            </label>
            <select
              value={referenceEnd}
              onChange={(e) => setReferenceEnd(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-transparent"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)", backgroundColor: "var(--color-surface)" }}
            >
              {sortedRefs.map((ref) => (
                <option key={ref} value={ref}>{ref}</option>
              ))}
            </select>
          </div>

          {/* Tipo de transação */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              {formatMessage({ id: "export.modal.transactionType" })}
            </label>
            <div className="flex gap-2">
              {TYPES.map(({ value, labelId }) => (
                <button
                  key={value}
                  onClick={() => setTransactionType(value)}
                  className="flex-1 text-sm py-1.5 rounded-lg border transition-colors"
                  style={{
                    borderColor: transactionType === value ? "var(--color-primary)" : "var(--color-border)",
                    backgroundColor: transactionType === value ? "var(--color-primary)" : "transparent",
                    color: transactionType === value ? "#fff" : "var(--color-text-primary)",
                  }}
                >
                  {formatMessage({ id: labelId })}
                </button>
              ))}
            </div>
          </div>

          {/* Moedas */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              {formatMessage({ id: "export.modal.currencies" })}
            </label>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_CURRENCIES.map((c) => {
                const selected = selectedCurrencies.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCurrency(c)}
                    className="text-xs px-2 py-1 rounded-lg border transition-colors"
                    style={{
                      borderColor: selected ? "var(--color-primary)" : "var(--color-border)",
                      backgroundColor: selected ? "var(--color-primary)" : "transparent",
                      color: selected ? "#fff" : "var(--color-text-primary)",
                    }}
                  >
                    {getCurrencyFlag(c)} {c}
                  </button>
                );
              })}
            </div>
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {formatMessage({ id: "export.modal.currencies.hint" })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-2">
            <Dialog.Close render={
              <Button variant="secondary" disabled={isExporting}>
                {formatMessage({ id: "login.cancel" })}
              </Button>
            } />
            <Button onClick={handleExport} disabled={isExporting} className="flex gap-1 items-center">
              {isExporting && <CircularProgress size={14} />}
              {formatMessage({ id: "export.modal.confirm" })}
            </Button>
          </div>

        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
