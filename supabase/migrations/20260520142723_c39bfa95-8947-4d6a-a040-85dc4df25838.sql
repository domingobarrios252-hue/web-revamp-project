
-- Videos: add relational FKs
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS event_id uuid,
  ADD COLUMN IF NOT EXISTS club_id uuid,
  ADD COLUMN IF NOT EXISTS news_id uuid,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_videos_event ON public.videos(event_id);
CREATE INDEX IF NOT EXISTS idx_videos_club ON public.videos(club_id);

-- MVP ranking columns
ALTER TABLE public.mvp_awards
  ADD COLUMN IF NOT EXISTS points numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS previous_position integer,
  ADD COLUMN IF NOT EXISTS skater_id uuid,
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'es';

CREATE INDEX IF NOT EXISTS idx_mvp_awards_ranking ON public.mvp_awards(season_id, tier, gender, points DESC);

-- Live timeline
CREATE TABLE IF NOT EXISTS public.live_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  entry_type text NOT NULL DEFAULT 'update',
  message text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.live_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_timeline viewable by everyone" ON public.live_timeline FOR SELECT USING (
  (published = true) OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role)
);
CREATE POLICY "live_timeline insert admin/editor" ON public.live_timeline FOR INSERT WITH CHECK (
  has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role)
);
CREATE POLICY "live_timeline update admin/editor" ON public.live_timeline FOR UPDATE USING (
  has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role)
);
CREATE POLICY "live_timeline delete admin/editor" ON public.live_timeline FOR DELETE USING (
  has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role)
);

CREATE INDEX IF NOT EXISTS idx_live_timeline_event ON public.live_timeline(event_id, occurred_at DESC);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.live_timeline;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Community submissions
CREATE TABLE IF NOT EXISTS public.community_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_type text NOT NULL DEFAULT 'noticia',
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  title text NOT NULL,
  description text NOT NULL,
  image_urls text[] NOT NULL DEFAULT '{}',
  links text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pendiente',
  country_code text NOT NULL DEFAULT 'es',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit community" ON public.community_submissions FOR INSERT WITH CHECK (
  char_length(name) BETWEEN 2 AND 120
  AND char_length(email) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(title) BETWEEN 3 AND 200
  AND char_length(description) BETWEEN 10 AND 5000
  AND (array_length(image_urls,1) IS NULL OR array_length(image_urls,1) <= 10)
  AND (array_length(links,1) IS NULL OR array_length(links,1) <= 10)
  AND status = 'pendiente'
);
CREATE POLICY "Staff view community" ON public.community_submissions FOR SELECT USING (
  has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role)
);
CREATE POLICY "Staff update community" ON public.community_submissions FOR UPDATE USING (
  has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role)
);
CREATE POLICY "Admin delete community" ON public.community_submissions FOR DELETE USING (
  has_role(auth.uid(),'admin'::app_role)
);

CREATE TRIGGER update_community_submissions_updated_at BEFORE UPDATE ON public.community_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Skaters legend flag
ALTER TABLE public.skaters ADD COLUMN IF NOT EXISTS is_legend boolean NOT NULL DEFAULT false;
