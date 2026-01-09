-- Create a public view for leaderboard that only exposes necessary fields
CREATE OR REPLACE VIEW public.leaderboard_view AS 
SELECT id, username, points, avatar_url 
FROM profiles
ORDER BY points DESC;

-- Grant access to the view for both anonymous and authenticated users
GRANT SELECT ON public.leaderboard_view TO anon, authenticated;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Users can view their own full profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Authenticated users can view basic profile info of others (for showing usernames in UI)
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (true);

-- Admins can view all profiles (already have full access via authenticated policy, but explicit)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (has_role(auth.uid(), 'admin'));