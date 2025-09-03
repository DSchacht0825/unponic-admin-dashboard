import { createClient } from '@supabase/supabase-js'

// Use hardcoded values to avoid environment variable formatting issues in Vercel
const supabaseUrl = 'https://cedpadbflumqvuwfhxoz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZHBhZGJmbHVtcXZ1d2ZoeG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjIwMzgsImV4cCI6MjA3MjM5ODAzOH0.KpCzOB4YPLYGFyIzjqf4FUTXKbTkONoViUbMzUq-zUA'

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