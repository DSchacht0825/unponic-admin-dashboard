-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL DEFAULT '',
    middle TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    aka TEXT DEFAULT '',
    gender TEXT DEFAULT '',
    ethnicity TEXT DEFAULT '',
    age TEXT DEFAULT '',
    height TEXT DEFAULT '',
    weight TEXT DEFAULT '',
    hair TEXT DEFAULT '',
    eyes TEXT DEFAULT '',
    description TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    last_contact DATE,
    contacts INTEGER DEFAULT 0,
    date_created DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS (Row Level Security) policies
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON public.clients
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert access for authenticated users
CREATE POLICY "Enable insert access for authenticated users" ON public.clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow update access for authenticated users
CREATE POLICY "Enable update access for authenticated users" ON public.clients
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow delete access for authenticated users
CREATE POLICY "Enable delete access for authenticated users" ON public.clients
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;