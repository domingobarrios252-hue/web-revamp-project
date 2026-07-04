
ALTER TABLE public.ad_banners
  ADD COLUMN IF NOT EXISTS sponsor text,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

ALTER TABLE public.ad_banners ALTER COLUMN placement DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.ad_banner_placements (
  banner_id uuid NOT NULL REFERENCES public.ad_banners(id) ON DELETE CASCADE,
  placement text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (banner_id, placement)
);

CREATE INDEX IF NOT EXISTS ad_banner_placements_placement_idx
  ON public.ad_banner_placements(placement, sort_order);

GRANT SELECT ON public.ad_banner_placements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ad_banner_placements TO authenticated;
GRANT ALL ON public.ad_banner_placements TO service_role;

ALTER TABLE public.ad_banner_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Placements viewable by everyone when banner viewable"
  ON public.ad_banner_placements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_banners b
      WHERE b.id = ad_banner_placements.banner_id
        AND (b.active = true
             OR public.has_role(auth.uid(), 'admin'::app_role)
             OR public.has_role(auth.uid(), 'editor'::app_role))
    )
  );

CREATE POLICY "Admins/editors can insert placements"
  ON public.ad_banner_placements FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'editor'::app_role)
  );

CREATE POLICY "Admins/editors can update placements"
  ON public.ad_banner_placements FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'editor'::app_role)
  );

CREATE POLICY "Admins/editors can delete placements"
  ON public.ad_banner_placements FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'editor'::app_role)
  );

-- Realtime: allow subscribing to placement changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_banner_placements;

-- Backfill: migrate current single placement into new join table
INSERT INTO public.ad_banner_placements (banner_id, placement, sort_order)
SELECT id, placement, sort_order
FROM public.ad_banners
WHERE placement IS NOT NULL AND placement <> ''
ON CONFLICT (banner_id, placement) DO NOTHING;
