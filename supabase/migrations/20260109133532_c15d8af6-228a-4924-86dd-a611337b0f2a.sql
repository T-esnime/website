-- Fix security definer view by setting security_invoker = true
-- This ensures RLS policies are checked for the querying user, not the view creator
DROP VIEW IF EXISTS public.leaderboard_view;

CREATE VIEW public.leaderboard_view 
WITH (security_invoker = true)
AS 
SELECT id, username, points, avatar_url 
FROM profiles
ORDER BY points DESC;

-- Re-grant access
GRANT SELECT ON public.leaderboard_view TO anon, authenticated;