import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://cedpadbflumqvuwfhxoz.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZHBhZGJmbHVtcXZ1d2ZoeG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjIwMzgsImV4cCI6MjA3MjM5ODAzOH0.KpCzOB4YPLYGFyIzjqf4FUTXKbTkONoViUbMzUq-zUA'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

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