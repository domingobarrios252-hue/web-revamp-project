-- TV Settings (single row config)
CREATE TABLE public.tv_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  live_stream_url TEXT,
  live_title TEXT NOT NULL DEFAULT 'RollerZone TV',
  live_subtitle TEXT,
  live_starts_at TIMESTAMP WITH TIME ZONE,
  live_ends_at TIMESTAMP WITH TIME ZONE,
  next_event_title TEXT,
  next_event_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tv_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TV settings viewable by everyone"
  ON public.tv_settings FOR SELECT USING (true);

CREATE POLICY "Admins can insert tv settings"
  ON public.tv_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can update tv settings"
  ON public.tv_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete tv settings"
  ON public.tv_settings FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_tv_settings_updated_at
  BEFORE UPDATE ON public.tv_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial settings row
INSERT INTO public.tv_settings (live_title, live_subtitle)
VALUES ('RollerZone TV', 'El patinaje de velocidad como nunca lo has visto');

-- TV Broadcasts (próximas carreras)
CREATE TABLE public.tv_broadcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  stream_url TEXT,
  cover_url TEXT,
  platform TEXT NOT NULL DEFAULT 'YouTube',
  location TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tv_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Broadcasts viewable by everyone"
  ON public.tv_broadcasts FOR SELECT
  USING (published = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors can insert broadcasts"
  ON public.tv_broadcasts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors can update broadcasts"
  ON public.tv_broadcasts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete broadcasts"
  ON public.tv_broadcasts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_tv_broadcasts_updated_at
  BEFORE UPDATE ON public.tv_broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tv_broadcasts_scheduled ON public.tv_broadcasts(scheduled_at);

-- TV Highlights (grid de vídeos)
CREATE TABLE public.tv_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT,
  duration TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tv_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Highlights viewable by everyone"
  ON public.tv_highlights FOR SELECT
  USING (published = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors can insert highlights"
  ON public.tv_highlights FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors can update highlights"
  ON public.tv_highlights FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete highlights"
  ON public.tv_highlights FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_tv_highlights_updated_at
  BEFORE UPDATE ON public.tv_highlights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();