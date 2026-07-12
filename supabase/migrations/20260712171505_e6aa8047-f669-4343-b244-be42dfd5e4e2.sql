
-- Consolidate duplicate/overlapping policies on community_submissions
DROP POLICY IF EXISTS "Anyone can submit to community" ON public.community_submissions;
DROP POLICY IF EXISTS "Staff view community" ON public.community_submissions;
DROP POLICY IF EXISTS "Staff update community" ON public.community_submissions;
DROP POLICY IF EXISTS "Admin delete community" ON public.community_submissions;

-- Explicitly deny INSERTs into news_views from client roles.
-- All view registration must go through public.register_news_view (SECURITY DEFINER).
REVOKE INSERT ON public.news_views FROM anon, authenticated;

DROP POLICY IF EXISTS "No direct inserts to news_views" ON public.news_views;
CREATE POLICY "No direct inserts to news_views"
  ON public.news_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);
