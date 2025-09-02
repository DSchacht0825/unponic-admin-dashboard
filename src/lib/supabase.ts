import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Client = {
  id?: string
  first_name: string
  middle: string
  last_name: string
  aka: string
  gender: string
  ethnicity: string
  age: string
  height: string
  weight: string
  hair: string
  eyes: string
  description: string
  notes: string
  last_contact: string
  contacts: number
  date_created: string
  created_at?: string
  updated_at?: string
}