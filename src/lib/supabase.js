import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseInstance = null

/**
 * Lazy-initialized Supabase client.
 * Throws a clear error if environment variables are missing when accessed.
 */
export const supabase = new Proxy({}, {
  get(target, prop) {
    if (!supabaseInstance) {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'Supabase configuration is missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables (Secrets panel).'
        )
      }
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
    }
    return supabaseInstance[prop]
  }
})
