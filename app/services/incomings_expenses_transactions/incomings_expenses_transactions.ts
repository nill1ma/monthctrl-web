"use server";
import { PAGE_SIZE } from "@/app/constants/pagination";
import { createClient } from "@/app/lib/supabase";
import { CurrencyEntry, ReferenceGroup, ReferenceGroupResponse } from "./incomings_expenses_transactions.types";
import type { DetailedTransaction } from "@/app/lib/pdf";

export async function getIncomingsExpensesTransactions(page: number): Promise<ReferenceGroupResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Usuário não autenticado");

  const offset = (page - 1) * PAGE_SIZE;

  // 1. Referências distintas paginadas
  const { data: refsData, error: refsError } = await supabase
    .rpc('get_distinct_references', {
      p_limit: PAGE_SIZE,
      p_offset: offset,
      p_user_id: user.id,
    });

  if (refsError) throw refsError;
  if (!refsData || refsData.length === 0) return { data: [], totalElements: 0 };

  const totalElements = refsData[0]?.total_count ?? 0;
  const references = refsData.map((r: { reference: string }) => r.reference);

  // 2. Totais agrupados por (reference, currency) para essas referências
  const { data: grouped, error: groupedError } = await supabase
    .from('incomings_expenses_transactions_grouped')
    .select('reference, currency, incoming_value, expense_value, net_income')
    .eq('user_id', user.id)
    .in('reference', references);

  if (groupedError) throw groupedError;

  // 3. Agrupa por reference mantendo a ordem original
  const groupMap = new Map<string, CurrencyEntry[]>();
  for (const ref of references) groupMap.set(ref, []);

  for (const row of grouped ?? []) {
    if (!row.reference) continue;
    const entries = groupMap.get(row.reference) ?? [];
    entries.push({
      currency: row.currency ?? "BRL",
      incoming_value: row.incoming_value ?? 0,
      expense_value: row.expense_value ?? 0,
      net_income: row.net_income ?? 0,
    });
    groupMap.set(row.reference, entries);
  }

  const data: ReferenceGroup[] = references.map((ref) => ({
    reference: ref,
    currencies: groupMap.get(ref) ?? [],
  }));

  return { data, totalElements };
}

export async function getDetailedTransactionsByReferences(
  references: string[],
  userId: string,
): Promise<DetailedTransaction[]> {
  const supabase = await createClient();

  const [incomingsRes, expensesRes] = await Promise.all([
    supabase
      .from("incomings")
      .select("reference, origin, value, currency")
      .eq("user_id", userId)
      .in("reference", references),
    supabase
      .from("expenses")
      .select("reference, destination, value, currency")
      .eq("user_id", userId)
      .in("reference", references),
  ]);

  if (incomingsRes.error) throw incomingsRes.error;
  if (expensesRes.error) throw expensesRes.error;

  const incomingRows: DetailedTransaction[] = (incomingsRes.data ?? []).map((r) => ({
    reference: r.reference,
    description: r.origin,
    value: r.value ?? 0,
    currency: r.currency ?? "BRL",
    type: "incoming",
  }));

  const expenseRows: DetailedTransaction[] = (expensesRes.data ?? []).map((r) => ({
    reference: r.reference,
    description: r.destination,
    value: r.value ?? 0,
    currency: r.currency ?? "BRL",
    type: "expense",
  }));

  return [...incomingRows, ...expenseRows];
}
