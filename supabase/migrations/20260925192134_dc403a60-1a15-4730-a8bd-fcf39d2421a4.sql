ALTER TABLE public.ad_banners
  ADD COLUMN image_mobile_url text,
  ADD COLUMN mobile_fallback text NOT NULL DEFAULT 'use_desktop',
  ADD COLUMN device_target text NOT NULL DEFAULT 'all',
  ADD COLUMN sponsor_id uuid REFERENCES public.sponsors(id) ON DELETE SET NULL;
ALTER TABLE public.ad_banners
  ADD CONSTRAINT ad_banners_mobile_fallback_chk CHECK (mobile_fallback IN ('use_desktop','hide')),
  ADD CONSTRAINT ad_banners_device_target_chk CHECK (device_target IN ('all','desktop','mobile'));

CREATE TABLE public.ad_banner_stats_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id uuid REFERENCES public.ad_banners(id) ON DELETE SET NULL,
  banner_ref uuid NOT NULL,
  banner_name text NOT NULL,
  advertiser_name text,
  placement text NOT NULL,
  device text NOT NULL CHECK (device IN ('desktop','mobile')),
  day date NOT NULL DEFAULT current_date,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (banner_ref, placement, device, day)
);
GRANT SELECT ON public.ad_banner_stats_daily TO authenticated;
GRANT ALL ON public.ad_banner_stats_daily TO service_role;
ALTER TABLE public.ad_banner_stats_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view banner stats" ON public.ad_banner_stats_daily
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_ad_banner_stats_daily_updated_at BEFORE UPDATE ON public.ad_banner_stats_daily
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.record_ad_event(_banner_id uuid, _placement text, _device text, _kind text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b record;
  adv text;
BEGIN
  IF _device NOT IN ('desktop','mobile') OR _kind NOT IN ('impression','click') THEN
    RETURN false;
  END IF;
  SELECT ab.id, ab.name, ab.sponsor, ab.sponsor_id INTO b
    FROM public.ad_banners ab
    JOIN public.ad_banner_placements p ON p.banner_id = ab.id AND p.placement = _placement
   WHERE ab.id = _banner_id AND ab.active = true
     AND (ab.starts_at IS NULL OR ab.starts_at <= now())
     AND (ab.ends_at IS NULL OR ab.ends_at >= now())
   LIMIT 1;
  IF NOT FOUND THEN RETURN false; END IF;
  IF NOT public.check_rate_limit('ad_' || _kind, _banner_id::text || ':' || _placement, 600, 60) THEN
    RETURN false;
  END IF;
  SELECT s.name INTO adv FROM public.sponsors s WHERE s.id = b.sponsor_id;
  adv := COALESCE(adv, NULLIF(b.sponsor, ''));
  INSERT INTO public.ad_banner_stats_daily AS st (banner_id, banner_ref, banner_name, advertiser_name, placement, device, day, impressions, clicks)
  VALUES (b.id, b.id, b.name, adv, _placement, _device, current_date,
          CASE WHEN _kind = 'impression' THEN 1 ELSE 0 END,
          CASE WHEN _kind = 'click' THEN 1 ELSE 0 END)
  ON CONFLICT (banner_ref, placement, device, day) DO UPDATE
    SET impressions = st.impressions + EXCLUDED.impressions,
        clicks = st.clicks + EXCLUDED.clicks,
        banner_name = EXCLUDED.banner_name,
        advertiser_name = EXCLUDED.advertiser_name,
        banner_id = EXCLUDED.banner_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.record_ad_event(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_ad_event(uuid, text, text, text) TO anon, authenticated;