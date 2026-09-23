"use server";

import { createClient } from "@/app/lib/supabase";
import { IncomingsExpensesTransaction, IncomingsExpensesTransactionResponse } from "./incomings_expenses_transactions.types";
import { randomUUID } from "node:crypto";

const PAGE_SIZE = 2;

export async function getIncomingsExpensesTransactions(page: number): Promise<IncomingsExpensesTransactionResponse> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('incomings_expenses_transactions_grouped')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .range(from, to)

  if (error) throw error

  const result: IncomingsExpensesTransaction[] = (data ?? [])
    .filter((item) => item.reference !== null)
    .map((item) => ({
      reference: item.reference!,
      incoming_value: item.incoming_value ?? 0,
      expense_value: item.expense_value ?? 0,
      net_income: item.net_income ?? 0,
      id: randomUUID(),
    }))

  return { data: result, totalElements: count ?? 0 }
}