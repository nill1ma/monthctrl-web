import { getIncomingsExpensesTransactions } from "@/app/services/incomings_expenses_transactions/incomings_expenses_transactions";
import { useQuery } from "@tanstack/react-query";
import { ReferenceGroupResponse } from "@/app/services/incomings_expenses_transactions/incomings_expenses_transactions.types";

export function useIncomingsExpensesTransactionsList(page: number) {
  const { data, isLoading } = useQuery<ReferenceGroupResponse>({
    queryKey: ['incomings-expenses-transactions', page],
    queryFn: () => getIncomingsExpensesTransactions(page),
    enabled: !!page,
  });
  return { data, isLoading };
}
