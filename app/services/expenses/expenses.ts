"use server";

import { createClient } from "@/app/lib/supabase";
import { CreateExpense, Expense, UpdateExpense } from "./expenses.types";

export async function getExpenses() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")
  const { data, error } = await supabase
    .from('expenses')
    .select('id, reference, value')
    .eq('user_id', user.id)
  if (error) throw error.message
  return data

}

export async function getExpenseByReference(reference: string): Promise<Pick<Expense, 'id' | 'value' | 'destination' | 'currency'>[]> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")
  const { data, error } = await supabase
    .from('expenses')
    .select('id, value, destination, currency')
    .eq('reference', reference)
    .eq('user_id', user.id)
  if (error) throw error.message
  return data
}

export async function getExpenseById(id:string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")
  const { data, error } = await supabase
    .from('expenses')
    .select('id, destination, value, reference')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (error) throw error.message
  return data
}

export async function createExpense(
  formData: CreateExpense
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...formData,
      user_id: user.id
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateExpense(
  formData: UpdateExpense
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")

  const { data, error } = await supabase
    .from('expenses')
    .update({
      destination: formData.destination, 
      value: formData.value, 
      reference: formData.reference,
      user_id: user.id
    })
    .eq('id', formData.id)
    .select()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteExpense(
  expense_id: string
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")

  const { data, error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expense_id)

  if (error) throw new Error(error.message)
  return data
}
export async function deleteExpensesByReference(reference: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('reference', reference)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
}
