"use server";

import { createClient } from "@/app/lib/supabase";
import { CreateIncoming, Incoming, UpdateIncoming } from "./incomings.types";

export async function getIncomings() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")
  const { data, error } = await supabase
    .from('incomings')
    .select('id, reference, value')
    .eq('user_id', user.id)
  if (error) throw error.message
  return data

}

export async function getIncomingsById(id:string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")
  const { data, error } = await supabase
    .from('incomings')
    .select('id, origin, value, reference')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (error) throw error.message
  return data
}

export async function getIncomingByReference(reference: string): Promise<Pick<Incoming, 'id' | 'value' | 'origin'>[]> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")
  const { data, error } = await supabase
    .from('incomings')
    .select('id, value, origin, currency')
    .eq('reference', reference)
    .eq('user_id', user.id)
  if (error) throw error.message
  return data
}

export async function createIncoming(
  formData: CreateIncoming
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('[createIncoming]', 'user:', user?.id ?? 'NENHUM', '| authError:', authError?.message)
  if (authError || !user) throw new Error("Usuário não autenticado")

  const { data, error } = await supabase
    .from('incomings')
    .insert({
      ...formData,
      user_id: user.id
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateIncoming(
  formData: UpdateIncoming
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")

  const { data, error } = await supabase
    .from('incomings')
    .update({
      origin: formData.origin,
      value: formData.value, 
      reference: formData.reference, 
      user_id: user.id
    })
    .eq('id', formData.id)
    .select()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteIncoming(
  incoming_id: string
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")

  const { data, error } = await supabase
    .from('incomings')
    .delete()
    .eq('id', incoming_id)

  if (error) throw new Error(error.message)
  return data
}
export async function deleteIncomingsByReference(reference: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")
  const { error } = await supabase
    .from('incomings')
    .delete()
    .eq('reference', reference)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
}
