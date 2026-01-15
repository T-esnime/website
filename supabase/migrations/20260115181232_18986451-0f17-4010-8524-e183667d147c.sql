-- Create a view for public access to approved submissions that hides user_id for anonymous submissions
CREATE VIEW public.approved_submissions_view 
WITH (security_invoker = true) AS 
SELECT 
  id, 
  section_id, 
  content, 
  status, 
  created_at, 
  updated_at, 
  is_anonymous,
  admin_feedback,
  reviewed_at,
  reviewed_by,
  CASE WHEN is_anonymous THEN NULL ELSE user_id END as user_id
FROM public.submissions
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.approved_submissions_view TO anon, authenticated;

-- Remove the policy that allows everyone to view approved submissions directly
-- This prevents direct table access from exposing user_id for anonymous submissions
DROP POLICY IF EXISTS "Everyone can view approved submissions" ON public.submissions;