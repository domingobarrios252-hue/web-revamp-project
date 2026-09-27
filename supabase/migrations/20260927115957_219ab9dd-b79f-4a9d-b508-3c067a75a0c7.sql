ALTER TABLE public.special_pieces ADD COLUMN IF NOT EXISTS feature_data jsonb;

CREATE TABLE public.special_piece_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id uuid NOT NULL REFERENCES public.special_pieces(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  category text, club text, specialty text,
  image_url text, alt_image_url text,
  country_code text DEFAULT 'es',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  bio text, button_label text, link_url text,
  skater_id uuid REFERENCES public.skaters(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.special_piece_members(piece_id, sort_order);
GRANT SELECT ON public.special_piece_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.special_piece_members TO authenticated;
GRANT ALL ON public.special_piece_members TO service_role;
ALTER TABLE public.special_piece_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View published members" ON public.special_piece_members FOR SELECT
  USING ((published AND EXISTS (SELECT 1 FROM public.special_pieces p WHERE p.id = piece_id AND p.visible)) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert members" ON public.special_piece_members FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update members" ON public.special_piece_members FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete members" ON public.special_piece_members FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_spm_updated BEFORE UPDATE ON public.special_piece_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.special_piece_member_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.special_piece_members(id) ON DELETE CASCADE,
  competition text NOT NULL DEFAULT '',
  event_name text, result text,
  medal text CHECK (medal IS NULL OR medal IN ('oro','plata','bronce')),
  result_date date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.special_piece_member_results(member_id, sort_order);
GRANT SELECT ON public.special_piece_member_results TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.special_piece_member_results TO authenticated;
GRANT ALL ON public.special_piece_member_results TO service_role;
ALTER TABLE public.special_piece_member_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View results of visible members" ON public.special_piece_member_results FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.special_piece_members m JOIN public.special_pieces p ON p.id=m.piece_id WHERE m.id = member_id AND m.published AND p.visible) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert results" ON public.special_piece_member_results FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update results" ON public.special_piece_member_results FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete results" ON public.special_piece_member_results FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_spmr_updated BEFORE UPDATE ON public.special_piece_member_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();