-- Fix user_roles table public exposure
-- Change "User roles are viewable by everyone" to require authentication

-- Drop the permissive public policy
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;

-- Create policy for authenticated users only
CREATE POLICY "Authenticated users can view user roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (true);

-- Allow users to view their own roles
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);