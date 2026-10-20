"use client";

import { buildDetailsPdfHtml } from "@/app/lib/pdf";
import { useState } from "react";

type Transaction = {
  label: string;
  value: number;
  currency: string;
};

type UseExportPdfParams = {
  reference: string;
  incomings: Transaction[];
  expenses: Transaction[];
};

export function useExportPdf({
  reference,
  incomings,
  expenses,
}: UseExportPdfParams) {
  const [isExporting, setIsExporting] = useState(false);

  function exportPdf() {
    setIsExporting(true);
    try {
      const html = buildDetailsPdfHtml({ reference, incomings, expenses });
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
