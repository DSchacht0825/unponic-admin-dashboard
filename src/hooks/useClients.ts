import { useState, useEffect } from 'react'
import { supabase, type Client } from '../lib/supabase'

export interface SupabaseClient {
  id: string
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
  last_contact: string | null
  contacts: number
  date_created: string
  created_at: string
  updated_at: string
}

export const useClients = () => {
  const [clients, setClients] = useState<SupabaseClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      setClients(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select()
        .single()
      
      if (error) throw error
      
      if (data) {
        setClients(prev => [data, ...prev])
      }
      
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add client'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      if (data) {
        setClients(prev => prev.map(client => 
          client.id === id ? data : client
        ))
      }
      
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setClients(prev => prev.filter(client => client.id !== id))
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete client'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  const searchClients = async (searchTerm: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,aka.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      setClients(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  return {
    clients,
    loading,
    error,
    fetchClients,
    addClient,
    updateClient,
    deleteClient,
    searchClients,
  }
}