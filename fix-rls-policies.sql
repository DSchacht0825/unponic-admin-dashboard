-- Temporary fix: Allow anonymous read access to clients table
-- WARNING: This allows public access - implement authentication for production

-- Allow read access for anonymous users (temporary fix)
CREATE POLICY "Allow anonymous read access (temporary)" ON public.clients
    FOR SELECT USING (true);

-- Allow insert access for anonymous users (temporary fix)
CREATE POLICY "Allow anonymous insert access (temporary)" ON public.clients
    FOR INSERT WITH CHECK (true);

-- Allow update access for anonymous users (temporary fix)
CREATE POLICY "Allow anonymous update access (temporary)" ON public.clients
    FOR UPDATE USING (true);

-- Allow delete access for anonymous users (temporary fix)
CREATE POLICY "Allow anonymous delete access (temporary)" ON public.clients
    FOR DELETE USING (true);

-- Grant permissions to anon role
GRANT ALL ON public.clients TO anon;