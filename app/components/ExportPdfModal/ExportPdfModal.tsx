"use client";

import { SUPPORTED_CURRENCIES, getCurrencyFlag } from "@/app/lib/currency";
import type { ExportFilters } from "@/app/hooks/useExportMenuPdf/useExportMenuPdf";
import type { TransactionType } from "@/app/lib/pdf";
import { CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { Button } from "@developmentsnil/awake-ui/button";
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{formatMessage({ id: "export.modal.title" })}</DialogTitle>

      <DialogContent className="flex flex-col gap-5 pt-4">

        {/* Período — início */}
        <FormControl fullWidth size="small">
          <InputLabel>{formatMessage({ id: "export.modal.referenceStart" })}</InputLabel>
          <Select
            value={referenceStart}
            label={formatMessage({ id: "export.modal.referenceStart" })}
            onChange={(e) => setReferenceStart(e.target.value)}
          >
            {sortedRefs.map((ref) => (
              <MenuItem key={ref} value={ref}>{ref}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Período — fim */}
        <FormControl fullWidth size="small">
          <InputLabel>{formatMessage({ id: "export.modal.referenceEnd" })}</InputLabel>
          <Select
            value={referenceEnd}
            label={formatMessage({ id: "export.modal.referenceEnd" })}
            onChange={(e) => setReferenceEnd(e.target.value)}
          >
            {sortedRefs.map((ref) => (
              <MenuItem key={ref} value={ref}>{ref}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Tipo de transação */}
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-500">{formatMessage({ id: "export.modal.transactionType" })}</span>
          <ToggleButtonGroup
            value={transactionType}
            exclusive
            onChange={(_, val) => { if (val) setTransactionType(val); }}
            size="small"
            fullWidth
          >
            <ToggleButton value="all">{formatMessage({ id: "export.modal.type.all" })}</ToggleButton>
            <ToggleButton value="incoming">{formatMessage({ id: "export.modal.type.incoming" })}</ToggleButton>
            <ToggleButton value="expense">{formatMessage({ id: "export.modal.type.expense" })}</ToggleButton>
          </ToggleButtonGroup>
        </div>

        {/* Filtro de moedas */}
        <FormControl fullWidth size="small">
          <InputLabel>{formatMessage({ id: "export.modal.currencies" })}</InputLabel>
          <Select
            multiple
            value={selectedCurrencies}
            label={formatMessage({ id: "export.modal.currencies" })}
            onChange={(e) => setSelectedCurrencies(e.target.value as string[])}
            renderValue={(selected) =>
              (selected as string[]).map((c) => `${getCurrencyFlag(c)} ${c}`).join(", ")
            }
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <MenuItem key={c} value={c}>
                {getCurrencyFlag(c)} {c}
              </MenuItem>
            ))}
          </Select>
          <span className="text-xs text-gray-400 mt-1">
            {formatMessage({ id: "export.modal.currencies.hint" })}
          </span>
        </FormControl>

      </DialogContent>

      <DialogActions className="p-4 gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isExporting}>
          {formatMessage({ id: "login.cancel" })}
        </Button>
        <Button onClick={handleExport} disabled={isExporting} className="flex gap-1 items-center">
          {isExporting && <CircularProgress size={14} />}
          {formatMessage({ id: "export.modal.confirm" })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
