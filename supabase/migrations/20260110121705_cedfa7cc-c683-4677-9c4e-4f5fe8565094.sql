-- Drop the overly permissive policy that allows all authenticated users to see all profiles
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;

-- The remaining policies are sufficient:
-- 1. "Users can view own profile" - users can see their own full profile
-- 2. "Admins can view all profiles" - admins can see all profiles
-- 3. The leaderboard_view provides public-safe data (username, points, avatar_url only)