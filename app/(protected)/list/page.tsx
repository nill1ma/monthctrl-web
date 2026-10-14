"use client";

import Loading from "@/app/components/loading/loading";
import { PAGE_SIZE } from "@/app/constants/pagination";
import { useIncomingsExpensesTransactionsList } from "@/app/hooks/useIncomingsExpensesTransactionsList/useIncomingsExpensesTransactionsList";
import { useIncomings } from "@/app/hooks/useIncomings/useIncomings";
import { useExpenses } from "@/app/hooks/useExpenses/useExpenses";
import { useExchangeRates } from "@/app/hooks/useExchangeRates/useExchangeRates";
import Pagination from "@/app/components/ui/Pagination/Pagination";
import { DeleteForever } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { DeleteReferenceDialog } from "./DeleteReferenceDialog";
import {
  getCurrencyFlag,
  convertToDisplayCurrency,
  formatCurrency,
  SUPPORTED_CURRENCIES,
} from "@/app/lib/currency";
import "./styles.css";

export default function List() {
  const { formatMessage } = useIntl();
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingRef, setDeletingRef] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
        setQuery("");
      }
    }
    if (pickerOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

  const filteredCurrencies = useMemo(
    () =>
      SUPPORTED_CURRENCIES.filter((c) =>
        c.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

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

  const converting = displayCurrency !== null;

  const targetCurrencies = useMemo(
    () => (displayCurrency ? allCurrencies.filter((c) => c !== displayCurrency) : []),
    [allCurrencies, displayCurrency]
  );

  const { data: rates } = useExchangeRates(displayCurrency ?? "", targetCurrencies);

  if (isLoading) return <Loading />;

  if (!data || data.totalElements === 0) {
    return <div className="flex items-center justify-center h-full">{formatMessage({ id: "list.empty" })}</div>;
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

      {/* Botão de conversão */}
      <div className="flex justify-end px-1">
        <div ref={pickerRef} className="relative">
          {pickerOpen ? (
            <div className="currency-search-wrapper">
              <input
                autoFocus
                className="currency-search-input"
                placeholder={formatMessage({ id: "list.currency.searchPlaceholder" })}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && (setPickerOpen(false), setQuery(""))}
              />
              {filteredCurrencies.length > 0 && (
                <div className="currency-picker-popup">
                  {displayCurrency && (
                    <button
                      className="currency-picker-item"
                      onClick={() => { setDisplayCurrency(null); setPickerOpen(false); setQuery(""); }}
                    >
                      {formatMessage({ id: "list.currency.original" })}
                    </button>
                  )}
                  {filteredCurrencies.map((c) => (
                    <button
                      key={c}
                      className={`currency-picker-item ${displayCurrency === c ? "currency-picker-item--active" : ""}`}
                      onClick={() => { setDisplayCurrency(c); setPickerOpen(false); setQuery(""); }}
                    >
                      {getCurrencyFlag(c)} {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              className={`currency-convert-trigger ${converting ? "currency-convert-trigger--active" : ""}`}
              onClick={() => {
                if (converting) { setDisplayCurrency(null); }
                else { setPickerOpen(true); }
              }}
            >
              <span className="currency-convert-icon">💱</span>
              {converting && displayCurrency && (
                <span className="currency-convert-label">
                  {getCurrencyFlag(displayCurrency)} {displayCurrency}
                </span>
              )}
            </button>
          )}
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

            <Tooltip title={formatMessage({ id: "list.deleteRef.tooltip" }, { reference: group.reference })} arrow placement="top">
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
    </div>
  );
}
