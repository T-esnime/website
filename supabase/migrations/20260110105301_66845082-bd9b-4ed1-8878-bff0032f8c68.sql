-- Drop the overly permissive policy that allows anyone to view profiles
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create a new policy that actually requires authentication
CREATE POLICY "Authenticated users can view basic profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);
