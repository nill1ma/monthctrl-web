"use server"

import { createClient } from "@/app/lib/supabase"
import { revalidatePath } from "next/cache"

export type ProfileData = {
  name: string
  nickname?: string | null
  occupation?: string | null
  preferred_currency: string
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")

  const { data, error } = await supabase
    .from("profiles")
    .select("name, nickname, occupation, preferred_currency")
    .eq("user_id", user.id)
    .single()

  if (error && error.code !== "PGRST116") throw error

  return data ?? null
}

export async function saveProfile(profile: ProfileData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Usuário não autenticado")

  const { error } = await supabase
    .from("profiles")
    .upsert({
      user_id: user.id,
      name: profile.name,
      nickname: profile.nickname ?? null,
      occupation: profile.occupation ?? null,
      preferred_currency: profile.preferred_currency,
    }, { onConflict: "user_id" })

  if (error) throw error

  revalidatePath("/profile")
}

export async function changePassword(newPassword: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
