-- Create client_interactions table for detailed interaction tracking
CREATE TABLE IF NOT EXISTS public.client_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    worker_name TEXT NOT NULL,
    interaction_type TEXT NOT NULL DEFAULT 'contact', -- contact, service, referral, follow_up, etc.
    notes TEXT NOT NULL,
    location_lat DECIMAL(10, 8), -- GPS latitude
    location_lng DECIMAL(11, 8), -- GPS longitude
    location_address TEXT, -- Reverse geocoded address (optional)
    location_accuracy DECIMAL, -- GPS accuracy in meters
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_minutes INTEGER, -- How long the interaction lasted
    services_provided TEXT[], -- Array of services provided
    client_status TEXT, -- Client condition/status during interaction
    weather_conditions TEXT, -- Optional weather info
    photos TEXT[], -- Array of photo URLs if any
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_client_interactions_client_id ON public.client_interactions(client_id);
CREATE INDEX idx_client_interactions_worker ON public.client_interactions(worker_name);
CREATE INDEX idx_client_interactions_date ON public.client_interactions(interaction_date);
CREATE INDEX idx_client_interactions_location ON public.client_interactions(location_lat, location_lng);

-- Enable RLS (Row Level Security)
ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;

-- Allow read access for all users (temporary - match clients table)
CREATE POLICY "Enable read access for all users" ON public.client_interactions
    FOR SELECT USING (true);

-- Allow insert access for all users (temporary)
CREATE POLICY "Enable insert access for all users" ON public.client_interactions
    FOR INSERT WITH CHECK (true);

-- Allow update access for all users (temporary)
CREATE POLICY "Enable update access for all users" ON public.client_interactions
    FOR UPDATE USING (true);

-- Allow delete access for all users (temporary)
CREATE POLICY "Enable delete access for all users" ON public.client_interactions
    FOR DELETE USING (true);

-- Grant permissions to anon role
GRANT ALL ON public.client_interactions TO anon;
GRANT ALL ON public.client_interactions TO authenticated;
GRANT ALL ON public.client_interactions TO service_role;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_client_interactions_updated_at 
    BEFORE UPDATE ON public.client_interactions
    FOR EACH ROW EXECUTE FUNCTION update_client_interactions_updated_at();

-- Create view for interaction summary by client
CREATE OR REPLACE VIEW public.client_interaction_summary AS
SELECT 
    c.id as client_id,
    c.first_name,
    c.last_name,
    COUNT(ci.id) as total_interactions,
    MAX(ci.interaction_date) as last_interaction,
    COUNT(DISTINCT ci.worker_name) as workers_contacted,
    ARRAY_AGG(DISTINCT ci.worker_name) as worker_names,
    COUNT(*) FILTER (WHERE ci.interaction_date >= NOW() - INTERVAL '30 days') as interactions_last_30_days,
    COUNT(*) FILTER (WHERE ci.interaction_date >= NOW() - INTERVAL '7 days') as interactions_last_7_days
FROM public.clients c
LEFT JOIN public.client_interactions ci ON c.id = ci.client_id
GROUP BY c.id, c.first_name, c.last_name;

-- Grant permissions on view
GRANT SELECT ON public.client_interaction_summary TO anon;
GRANT SELECT ON public.client_interaction_summary TO authenticated;
GRANT SELECT ON public.client_interaction_summary TO service_role;