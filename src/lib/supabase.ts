import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface UrineEntry {
  id: string
  parent: string
  amount: number
  urine_color: string
  timestamp: string
  created_at?: string
}

export interface DressingEntry {
  id: string
  parent: string
  dressing_type: string
  location: string
  condition: string
  timestamp: string
  created_at?: string
}