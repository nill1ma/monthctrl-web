import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { Database } from './supabase.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createBrowserClient() {
  return createSupabaseBrowserClient<Database>(supabaseUrl, supabaseKey)
}
