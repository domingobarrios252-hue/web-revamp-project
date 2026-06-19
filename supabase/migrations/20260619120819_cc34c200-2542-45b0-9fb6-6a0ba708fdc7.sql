
CREATE TABLE public.result_csv_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.result_csv_mappings TO authenticated;
GRANT ALL ON public.result_csv_mappings TO service_role;

ALTER TABLE public.result_csv_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editorial staff can view csv mappings"
  ON public.result_csv_mappings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editorial staff can insert csv mappings"
  ON public.result_csv_mappings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editorial staff can update csv mappings"
  ON public.result_csv_mappings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Editorial staff can delete csv mappings"
  ON public.result_csv_mappings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE TRIGGER update_result_csv_mappings_updated_at
  BEFORE UPDATE ON public.result_csv_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
