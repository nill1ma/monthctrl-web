"use client";

import { buildExportPdfHtml, getReferencesInRange } from "@/app/lib/pdf";
import { getDetailedTransactionsByReferences } from "@/app/services/incomings_expenses_transactions/incomings_expenses_transactions";
import { useState } from "react";
import { createBrowserClient } from "@/app/lib/supabase";
import type { TransactionType } from "@/app/lib/pdf";

export type ExportFilters = {
  referenceStart: string;
  referenceEnd: string;
  transactionType: TransactionType;
  currencies: string[] | "all";
};

export function useExportMenuPdf() {
  const [isExporting, setIsExporting] = useState(false);

  async function exportPdf(filters: ExportFilters) {
    setIsExporting(true);
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { referenceStart, referenceEnd, transactionType, currencies } = filters;

      const allReferences = getReferencesInRange(referenceStart, referenceEnd);
      let data = await getDetailedTransactionsByReferences(allReferences, user.id);

      if (transactionType !== "all") {
        data = data.filter((row) => row.type === transactionType);
      }

      if (currencies !== "all") {
        data = data.filter((row) => (currencies as string[]).includes(row.currency));
      }

      const html = buildExportPdfHtml(data, {
        referenceStart,
        referenceEnd,
        transactionType,
      });

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        win.onload = () => {
          win.print();
          URL.revokeObjectURL(url);
        };
      }
    } finally {
      setIsExporting(false);
    }
  }

  return { exportPdf, isExporting };
}
