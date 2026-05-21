
ALTER TABLE public.community_submissions
  ADD COLUMN IF NOT EXISTS news_id uuid;

CREATE TABLE IF NOT EXISTS public.community_submission_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.community_submissions(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_submission_logs_submission_id_idx
  ON public.community_submission_logs(submission_id);

ALTER TABLE public.community_submission_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view community logs" ON public.community_submission_logs;
CREATE POLICY "Staff view community logs"
  ON public.community_submission_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

DROP POLICY IF EXISTS "Staff insert community logs" ON public.community_submission_logs;
CREATE POLICY "Staff insert community logs"
  ON public.community_submission_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
