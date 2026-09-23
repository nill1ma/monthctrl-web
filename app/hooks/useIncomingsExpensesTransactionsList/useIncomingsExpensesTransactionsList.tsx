import { getIncomingsExpensesTransactions } from "@/app/services/incomings_expenses_transactions/incomings_expenses_transactions";
import { useQuery } from "@tanstack/react-query";
import { IncomingsExpensesTransactionResponse } from "@/app/services/incomings_expenses_transactions/incomings_expenses_transactions.types";

export function useIncomingsExpensesTransactionsList(page: number) {
  const { data, isLoading } = useQuery<IncomingsExpensesTransactionResponse>({
    queryKey: ['incomings-expenses-transactions', page],
    queryFn: () => getIncomingsExpensesTransactions(page),
    enabled: !!page,
  });
  return {
    data,
    isLoading,
  };
}