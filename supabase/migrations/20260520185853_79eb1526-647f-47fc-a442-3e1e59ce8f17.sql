CREATE POLICY "Approved community submissions viewable by everyone"
ON public.community_submissions
FOR SELECT
USING (status = 'aprobada');