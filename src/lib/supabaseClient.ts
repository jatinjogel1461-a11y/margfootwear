import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const PLACEHOLDER = "your-supabase-url-here"

if (!supabaseUrl || supabaseUrl === PLACEHOLDER) {
  console.error("[Supabase] VITE_SUPABASE_URL is missing or still the placeholder value. Check your .env file.")
}
if (!supabaseKey || supabaseKey === PLACEHOLDER) {
  console.error("[Supabase] VITE_SUPABASE_PUBLISHABLE_KEY is missing or still the placeholder value. Check your .env file.")
}

export const supabase = createClient(supabaseUrl, supabaseKey)