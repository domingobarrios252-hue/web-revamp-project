-- Newsletter: doble opt-in, evidencia de consentimiento y baja con token
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_version text,
  ADD COLUMN IF NOT EXISTS consent_text text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirm_token_hash text,
  ADD COLUMN IF NOT EXISTS confirm_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirm_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_token_hash text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_subscribers_status_check'
  ) THEN
    ALTER TABLE public.newsletter_subscribers
      ADD CONSTRAINT newsletter_subscribers_status_check
      CHECK (status IN ('pending', 'active', 'unsubscribed'));
  END IF;
END $$;

-- Suscriptores anteriores al doble opt-in: se conservan como activos heredados.
UPDATE public.newsletter_subscribers
   SET status = 'active',
       confirmed_at = COALESCE(confirmed_at, created_at),
       consent_at = COALESCE(consent_at, created_at),
       consent_version = COALESCE(consent_version, 'legacy-2025')
 WHERE consent_version IS NULL AND status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_key
  ON public.newsletter_subscribers (lower(email));

CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx
  ON public.newsletter_subscribers (status);

DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Nadie puede insertar/leer directamente: todo pasa por el backend (service role).
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
REVOKE INSERT, UPDATE ON public.newsletter_subscribers FROM anon, authenticated;
REVOKE SELECT ON public.newsletter_subscribers FROM anon;
GRANT SELECT, DELETE ON public.newsletter_subscribers TO authenticated; -- filtrado por RLS (solo admin)
GRANT ALL ON public.newsletter_subscribers TO service_role;