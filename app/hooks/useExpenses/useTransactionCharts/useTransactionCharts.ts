import { useMemo } from "react";
import { DetailsIncomingData } from "@/app/services/incomings/incomings.types";
import { DetailsIncomingData as DetailsExpenseData } from "@/app/services/expenses/expenses.types";

export type CurrencyGroup = {
  currency: string;
  incomings: number;
  expenses: number;
  netIncome: number;
};

export function useTransactionCharts(
  dataIncomings?: DetailsIncomingData[],
  dataExpenses?: DetailsExpenseData[],
) {
  const currencyGroups = useMemo<CurrencyGroup[]>(() => {
    const map = new Map<string, CurrencyGroup>();

    for (const item of dataIncomings ?? []) {
      const cur = item.currency ?? "BRL";
      const group = map.get(cur) ?? { currency: cur, incomings: 0, expenses: 0, netIncome: 0 };
      group.incomings += item.value ?? 0;
      map.set(cur, group);
    }

    for (const item of dataExpenses ?? []) {
      const cur = item.currency ?? "BRL";
      const group = map.get(cur) ?? { currency: cur, incomings: 0, expenses: 0, netIncome: 0 };
      group.expenses += item.value ?? 0;
      map.set(cur, group);
    }

    return Array.from(map.values()).map((g) => ({
      ...g,
      netIncome: g.incomings - g.expenses,
    }));
  }, [dataIncomings, dataExpenses]);

  return { currencyGroups };
}
