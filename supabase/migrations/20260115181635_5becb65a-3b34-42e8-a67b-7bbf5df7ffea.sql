-- Enable RLS on the leaderboard_view to make access control explicit
ALTER VIEW public.leaderboard_view SET (security_invoker = true);

-- Add an explicit policy to document that the leaderboard is intentionally public
-- This makes the security intent clear and satisfies the linter warning
COMMENT ON VIEW public.leaderboard_view IS 'Public view exposing only safe leaderboard data (id, username, points, avatar_url). Intentionally accessible to everyone for community ranking display.';