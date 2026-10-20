"use client";

import Loading from "@/app/components/loading/loading";
import { PAGE_SIZE } from "@/app/constants/pagination";
import { useIncomingsExpensesTransactionsList } from "@/app/hooks/useIncomingsExpensesTransactionsList/useIncomingsExpensesTransactionsList";
import { useIncomings } from "@/app/hooks/useIncomings/useIncomings";
import { useExpenses } from "@/app/hooks/useExpenses/useExpenses";
import { useExchangeRates } from "@/app/hooks/useExchangeRates/useExchangeRates";
import { useExportMenuPdf } from "@/app/hooks/useExportMenuPdf/useExportMenuPdf";
import { ExportPdfModal } from "@/app/components/ExportPdfModal/ExportPdfModal";
import Pagination from "@/app/components/ui/Pagination/Pagination";
import { DeleteForever, FileDownload } from "@mui/icons-material";
import { CircularProgress, Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { DeleteReferenceDialog } from "./DeleteReferenceDialog";
import {
  getCurrencyFlag,
  convertToDisplayCurrency,
  formatCurrency,
  SUPPORTED_CURRENCIES,
} from "@/app/lib/currency";
import { Autocomplete } from "@developmentsnil/awake-ui/autocomplete";
import "./styles.css";

const ORIGINAL_VALUE = "";


// Sub-componente necessário: useFilteredItems precisa estar dentro do contexto do Root
// O hook lê do contexto sem argumento e retorna apenas os itens que passam no filtro atual
function CurrencyList() {
  const filtered = Autocomplete.useFilteredItems<string>();
  return (
    <>
      {filtered.map((c) => (
        <Autocomplete.Item key={c} value={c}>
          {getCurrencyFlag(c)} {c}
        </Autocomplete.Item>
      ))}
    </>
  );
}

export default function List() {
  const { formatMessage } = useIntl();
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingRef, setDeletingRef] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const { exportPdf, isExporting } = useExportMenuPdf();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCurrencyChange = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDisplayCurrency(value || null);
    }, 400);
  }, []);

  const { data, isLoading } = useIncomingsExpensesTransactionsList(currentPage);
  const { deleteByReferenceMutation: deleteIncomings } = useIncomings();
  const { deleteByReferenceMutation: deleteExpenses } = useExpenses();
  const router = useRouter();

  const allCurrencies = useMemo(() => {
    if (!data?.data) return [];
    const set = new Set<string>();
    data.data.forEach((group) => group.currencies.forEach((c) => set.add(c.currency)));
    return Array.from(set).sort();
  }, [data]);

  // All available references from the loaded data (sorted)
  const availableReferences = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((g) => g.reference).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const converting = displayCurrency !== null;

  const targetCurrencies = useMemo(
    () => (displayCurrency ? allCurrencies.filter((c) => c !== displayCurrency) : []),
    [allCurrencies, displayCurrency]
  );

  const { data: rates } = useExchangeRates(displayCurrency ?? "", targetCurrencies);

  // items: strings simples (códigos) — o Item renderiza a label com bandeira
  const currencyItems = useMemo(
    () => SUPPORTED_CURRENCIES,
    []
  );

  if (isLoading) return <Loading />;

  if (!data || data.totalElements === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        {formatMessage({ id: "list.empty" })}
      </div>
    );
  }

  const totalPages = Math.ceil(data.totalElements / PAGE_SIZE);

  async function handleDeleteReference() {
    if (!deletingRef) return;
    setIsDeleting(true);
    try {
      await Promise.all([deleteIncomings(deletingRef), deleteExpenses(deletingRef)]);
      setDeletingRef(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">

      {/* Toolbar: seletor de moeda + botão export */}
      <div className="flex items-center justify-between px-1 gap-2">
        <Tooltip title={formatMessage({ id: "list.export.tooltip" })} arrow placement="top">
          <button
            onClick={() => setExportModalOpen(true)}
            disabled={isExporting}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <CircularProgress size={14} />
            ) : (
              <FileDownload fontSize="small" />
            )}
            {formatMessage({ id: "list.export.button" })}
          </button>
        </Tooltip>

        <div className="w-44">
          <Autocomplete.Root
            items={currencyItems}
            onValueChange={handleCurrencyChange}
          >
            <Autocomplete.InputGroup>
              <Autocomplete.Input
                placeholder={
                  converting && displayCurrency
                    ? `${getCurrencyFlag(displayCurrency)} ${displayCurrency}`
                    : formatMessage({ id: "list.currency.searchPlaceholder" })
                }
              />
              <Autocomplete.Clear />
              <Autocomplete.Trigger>▾</Autocomplete.Trigger>
            </Autocomplete.InputGroup>
            <Autocomplete.Portal>
              <Autocomplete.Positioner>
                <Autocomplete.Popup>
                  <Autocomplete.List>
                    <CurrencyList />
                  </Autocomplete.List>
                  <Autocomplete.Empty>
                    {formatMessage({ id: "list.currency.noResults" })}
                  </Autocomplete.Empty>
                </Autocomplete.Popup>
              </Autocomplete.Positioner>
            </Autocomplete.Portal>
          </Autocomplete.Root>
        </div>
      </div>

      {data.data.map((group) => (
        <div
          key={group.reference}
          className="border rounded-xl p-4 flex flex-col gap-2 relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <span
              className="text-base font-semibold cursor-pointer hover:underline"
              onClick={() => router.push(`/details/${encodeURIComponent(group.reference)}`)}
            >
              {group.reference}
            </span>

            <Tooltip
              title={formatMessage({ id: "list.deleteRef.tooltip" }, { reference: group.reference })}
              arrow
              placement="top"
            >
              <DeleteForever
                className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingRef(group.reference);
                }}
              />
            </Tooltip>
          </div>

          {/* Sub-linhas por moeda */}
          <div
            className="flex flex-col gap-1 cursor-pointer"
            onClick={() => router.push(`/details/${encodeURIComponent(group.reference)}`)}
          >
            {converting && rates && displayCurrency ? (
              (() => {
                let totalIncoming = 0;
                let totalExpense = 0;
                let hasNull = false;

                group.currencies.forEach((entry) => {
                  const inc = convertToDisplayCurrency(entry.incoming_value, entry.currency, displayCurrency, rates);
                  const exp = convertToDisplayCurrency(entry.expense_value, entry.currency, displayCurrency, rates);
                  if (inc === null || exp === null) { hasNull = true; return; }
                  totalIncoming += inc;
                  totalExpense += exp;
                });

                if (hasNull) {
                  return (
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {formatMessage({ id: "list.currency.unavailable" })}
                    </span>
                  );
                }

                const net = totalIncoming - totalExpense;
                return (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {getCurrencyFlag(displayCurrency)} {displayCurrency} ≈
                    </span>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600 font-medium">
                        {formatCurrency(totalIncoming, displayCurrency)}
                      </span>
                      <span className="text-red-500 font-medium">
                        {formatCurrency(totalExpense, displayCurrency)}
                      </span>
                      <span className={`font-bold ${net >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {formatCurrency(net, displayCurrency)}
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : (
              group.currencies.map((entry) => (
                <div key={entry.currency} className="flex flex-col gap-0.5">
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {getCurrencyFlag(entry.currency)} {entry.currency}
                  </span>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 font-medium">
                      {formatCurrency(entry.incoming_value, entry.currency)}
                    </span>
                    <span className="text-red-500 font-medium">
                      {formatCurrency(entry.expense_value, entry.currency)}
                    </span>
                    <span className={`font-bold ${entry.net_income >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {formatCurrency(entry.net_income, entry.currency)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(newPage) => setCurrentPage(newPage)}
      />

      <DeleteReferenceDialog
        reference={deletingRef ?? ""}
        open={!!deletingRef}
        onOpenChange={(open) => { if (!open) setDeletingRef(null); }}
        onConfirm={handleDeleteReference}
        isDeleting={isDeleting}
      />

      <ExportPdfModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={exportPdf}
        isExporting={isExporting}
        availableReferences={availableReferences}
      />
    </div>
  );
}
