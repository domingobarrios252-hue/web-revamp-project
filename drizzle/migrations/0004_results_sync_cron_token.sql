CREATE TABLE public.results_sync_cron_token (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32),'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.results_sync_cron_token TO service_role;
ALTER TABLE public.results_sync_cron_token ENABLE ROW LEVEL SECURITY;
INSERT INTO public.results_sync_cron_token (id) VALUES (1);