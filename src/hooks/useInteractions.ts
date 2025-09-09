import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ClientInteraction, InteractionFormData } from '../types/interactions';

export const useInteractions = (clientId?: string) => {
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInteractions = async (targetClientId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('client_interactions')
        .select('*')
        .order('interaction_date', { ascending: false });
      
      if (targetClientId || clientId) {
        query = query.eq('client_id', targetClientId || clientId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setInteractions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch interactions');
    } finally {
      setLoading(false);
    }
  };

  const addInteraction = async (clientId: string, formData: InteractionFormData): Promise<ClientInteraction | null> => {
    try {
      setError(null);
      
      const interactionData = {
        client_id: clientId,
        worker_name: formData.worker_name,
        interaction_type: formData.interaction_type,
        notes: formData.notes,
        location_lat: formData.location?.lat,
        location_lng: formData.location?.lng,
        location_address: formData.location?.address,
        location_accuracy: formData.location?.accuracy,
        duration_minutes: formData.duration_minutes,
        services_provided: formData.services_provided,
        client_status: formData.client_status,
        interaction_date: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('client_interactions')
        .insert([interactionData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setInteractions(prev => [data, ...prev]);
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add interaction');
      return null;
    }
  };

  const updateInteraction = async (interactionId: string, updates: Partial<ClientInteraction>) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('client_interactions')
        .update(updates)
        .eq('id', interactionId)
        .select()
        .single();
      
      if (error) throw error;
      
      setInteractions(prev => 
        prev.map(interaction => 
          interaction.id === interactionId ? data : interaction
        )
      );
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update interaction');
      return null;
    }
  };

  const deleteInteraction = async (interactionId: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('client_interactions')
        .delete()
        .eq('id', interactionId);
      
      if (error) throw error;
      
      setInteractions(prev => prev.filter(interaction => interaction.id !== interactionId));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete interaction');
      return false;
    }
  };

  const getInteractionsByWorker = async (workerName: string, days: number = 30) => {
    try {
      setLoading(true);
      setError(null);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('client_interactions')
        .select(`
          *,
          clients:client_id (
            first_name,
            last_name
          )
        `)
        .eq('worker_name', workerName)
        .gte('interaction_date', startDate.toISOString())
        .order('interaction_date', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch worker interactions');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getInteractionStats = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_interaction_summary')
        .select('*')
        .eq('client_id', clientId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch interaction stats');
      return null;
    }
  };

  // Auto-fetch interactions when clientId changes
  useEffect(() => {
    if (clientId) {
      fetchInteractions(clientId);
    }
  }, [clientId]);

  return {
    interactions,
    loading,
    error,
    fetchInteractions,
    addInteraction,
    updateInteraction,
    deleteInteraction,
    getInteractionsByWorker,
    getInteractionStats,
  };
};