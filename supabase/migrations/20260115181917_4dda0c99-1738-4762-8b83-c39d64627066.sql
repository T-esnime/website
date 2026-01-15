-- Create a view for aggregated vote counts per submission (hides individual user voting behavior)
CREATE VIEW public.vote_counts_view 
WITH (security_invoker = true) AS 
SELECT 
  submission_id,
  COUNT(*) FILTER (WHERE vote_type = 1) as upvotes,
  COUNT(*) FILTER (WHERE vote_type = -1) as downvotes
FROM public.votes
GROUP BY submission_id;

-- Grant access to the view
GRANT SELECT ON public.vote_counts_view TO anon, authenticated;

-- Drop the overly permissive public SELECT policy
-- This prevents anyone from tracking individual voting behavior
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.votes;

-- Add a policy so authenticated users can see only their own votes
-- This is needed for the UI to show the user's current vote state
CREATE POLICY "Users can view own votes" 
ON public.votes FOR SELECT 
USING (auth.uid() = user_id);