import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please configure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your environment.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

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

export type Interaction = {
  id?: string
  client_id: string
  worker_id: string
  worker_name: string
  interaction_type: string
  notes: string
  location_lat: number
  location_lng: number
  interaction_date: string
  created_at?: string
  updated_at?: string
}