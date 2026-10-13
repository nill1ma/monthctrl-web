"use client";

import Loading from "@/app/components/loading/loading";
import { PAGE_SIZE } from "@/app/constants/pagination";
import { useIncomingsExpensesTransactionsList } from "@/app/hooks/useIncomingsExpensesTransactionsList/useIncomingsExpensesTransactionsList";
import { useIncomings } from "@/app/hooks/useIncomings/useIncomings";
import { useExpenses } from "@/app/hooks/useExpenses/useExpenses";
import Pagination from "@/app/components/ui/Pagination/Pagination";
import { DeleteForever } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteReferenceDialog } from "./DeleteReferenceDialog";
import "./styles.css";

function getCurrencyFlag(currency: string): string {
  const flags: Record<string, string> = {
    BRL: "🇧🇷", USD: "🇺🇸", CAD: "🇨🇦", EUR: "🇪🇺", GBP: "🇬🇧",
  };
  return flags[currency] ?? "💱";
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

export default function List() {
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingRef, setDeletingRef] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading } = useIncomingsExpensesTransactionsList(currentPage);
  const { deleteByReferenceMutation: deleteIncomings } = useIncomings();
  const { deleteByReferenceMutation: deleteExpenses } = useExpenses();
  const router = useRouter();

  if (isLoading) return <Loading />;

  if (!data || data.totalElements === 0) {
    return <div className="flex items-center justify-center h-full">No data</div>;
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

            <Tooltip title={`Deletar todas as transações de ${group.reference}`} arrow placement="top">
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
            {group.currencies.map((entry) => (
              <div key={entry.currency} className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400">
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
            ))}
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
