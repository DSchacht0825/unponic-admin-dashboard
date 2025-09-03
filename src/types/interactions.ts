export interface ClientInteraction {
  id: string;
  client_id: string;
  worker_name: string;
  interaction_type: 'contact' | 'service' | 'referral' | 'follow_up' | 'assessment' | 'transport' | 'emergency';
  notes: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  location_accuracy?: number;
  interaction_date: string;
  duration_minutes?: number;
  services_provided?: string[];
  client_status?: string;
  weather_conditions?: string;
  photos?: string[];
  created_at: string;
  updated_at: string;
}

export interface InteractionLocation {
  lat: number;
  lng: number;
  address?: string;
  accuracy?: number;
}

export interface OutreachWorker {
  name: string;
  id: string;
  active: boolean;
}

export const OUTREACH_WORKERS: OutreachWorker[] = [
  { name: 'Alex', id: 'alex', active: true },
  { name: 'Kenneth', id: 'kenneth', active: true },
  { name: 'Kaylyn', id: 'kaylyn', active: true },
  { name: 'Angel', id: 'angel', active: true },
  { name: 'Mario', id: 'mario', active: true },
  { name: 'Marsha', id: 'marsha', active: true },
  { name: 'Ian', id: 'ian', active: true },
  { name: 'Sebastian', id: 'sebastian', active: true },
];

export const INTERACTION_TYPES = [
  { value: 'contact', label: 'General Contact', icon: '👋' },
  { value: 'service', label: 'Service Provided', icon: '🤝' },
  { value: 'referral', label: 'Referral Made', icon: '📋' },
  { value: 'follow_up', label: 'Follow-up', icon: '📞' },
  { value: 'assessment', label: 'Assessment', icon: '📝' },
  { value: 'transport', label: 'Transportation', icon: '🚐' },
  { value: 'emergency', label: 'Emergency Response', icon: '🚨' },
] as const;

export const SERVICE_TYPES = [
  'Food',
  'Water',
  'Clothing',
  'Hygiene Kit',
  'First Aid',
  'Mental Health Support',
  'Substance Abuse Help',
  'Housing Referral',
  'ID Assistance',
  'Benefits Application',
  'Job Resources',
  'Medical Referral',
  'Transportation',
  'Pet Care',
  'Storage',
  'Phone/Communication',
  'Other'
] as const;

export interface InteractionFormData {
  worker_name: string;
  interaction_type: ClientInteraction['interaction_type'];
  notes: string;
  duration_minutes?: number;
  services_provided?: string[];
  client_status?: string;
  location?: InteractionLocation;
}

// Re-export SupabaseClient type for convenience
export type { SupabaseClient } from '../hooks/useClients';