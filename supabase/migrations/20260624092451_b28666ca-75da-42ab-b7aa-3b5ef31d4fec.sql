CREATE TABLE public.contributor_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  club_or_federation TEXT,
  topics TEXT NOT NULL,
  role_type TEXT NOT NULL DEFAULT 'redactor',
  message TEXT,
  language TEXT NOT NULL DEFAULT 'es',
  status TEXT NOT NULL DEFAULT 'nuevo',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contributor_signups TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.contributor_signups TO authenticated;
GRANT ALL ON public.contributor_signups TO service_role;

ALTER TABLE public.contributor_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contributor signup"
  ON public.contributor_signups FOR INSERT
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 120
    AND char_length(email) BETWEEN 5 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(country) BETWEEN 2 AND 80
    AND char_length(topics) BETWEEN 2 AND 500
    AND (message IS NULL OR char_length(message) <= 3000)
    AND role_type IN ('redactor','corresponsal','fotografo','otro')
    AND status = 'nuevo'
  );

CREATE POLICY "Staff can read contributor signups"
  ON public.contributor_signups FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Staff can update contributor signups"
  ON public.contributor_signups FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins can delete contributor signups"
  ON public.contributor_signups FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_contributor_signups_updated_at
  BEFORE UPDATE ON public.contributor_signups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX contributor_signups_created_at_idx
  ON public.contributor_signups (created_at DESC);
CREATE INDEX contributor_signups_status_idx
  ON public.contributor_signups (status);