GRANT SELECT ON public.news_visibility TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news_visibility TO authenticated;
GRANT ALL ON public.news_visibility TO service_role;