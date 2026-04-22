-- Create table for skater rankings (separate from country medal standings)
CREATE TABLE public.skater_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position INTEGER NOT NULL DEFAULT 1,
  skater_name TEXT NOT NULL,
  team TEXT,
  country TEXT,
  country_code TEXT,
  flag_url TEXT,
  time_result TEXT,
  category TEXT,
  event_name TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.skater_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skater rankings viewable by everyone"
ON public.skater_rankings
FOR SELECT
USING ((published = true) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors can insert skater rankings"
ON public.skater_rankings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors can update skater rankings"
ON public.skater_rankings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete skater rankings"
ON public.skater_rankings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_skater_rankings_updated_at
BEFORE UPDATE ON public.skater_rankings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_skater_rankings_position ON public.skater_rankings(position);
CREATE INDEX idx_skater_rankings_published ON public.skater_rankings(published);