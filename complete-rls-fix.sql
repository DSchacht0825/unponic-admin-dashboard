-- Complete RLS fix: Allow access for all users (anonymous + authenticated)
-- Run these in your Supabase SQL Editor

-- Allow read access for all users
CREATE POLICY "Enable read access for all users" ON public.clients
    FOR SELECT USING (true);

-- Allow insert access for all users  
CREATE POLICY "Enable insert access for all users" ON public.clients
    FOR INSERT WITH CHECK (true);

-- Allow update access for all users
CREATE POLICY "Enable update access for all users" ON public.clients
    FOR UPDATE USING (true);

-- Allow delete access for all users (you already added this one)
CREATE POLICY "Enable delete access for all users" ON public.clients
    FOR DELETE USING (true);

-- Grant permissions to anon role
GRANT ALL ON public.clients TO anon;