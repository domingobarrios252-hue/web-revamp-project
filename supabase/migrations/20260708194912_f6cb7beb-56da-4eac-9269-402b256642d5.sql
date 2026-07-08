
CREATE TYPE public.result_doc_type AS ENUM ('clasificacion','resultados','acta','medallero','ranking','otro');
CREATE TYPE public.result_doc_status AS ENUM ('borrador','provisional','oficial','oculto');

CREATE TABLE public.result_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.result_events(id) ON DELETE CASCADE,
  jornada TEXT,
  name TEXT NOT NULL,
  doc_type public.result_doc_type NOT NULL DEFAULT 'clasificacion',
  status public.result_doc_status NOT NULL DEFAULT 'borrador',
  file_url TEXT NOT NULL,
  file_path TEXT,
  file_size BIGINT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX result_documents_event_idx ON public.result_documents(event_id, sort_order);

GRANT SELECT ON public.result_documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.result_documents TO authenticated;
GRANT ALL ON public.result_documents TO service_role;

ALTER TABLE public.result_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visible official/provisional docs"
  ON public.result_documents FOR SELECT
  USING (visible = true AND status IN ('oficial','provisional'));

CREATE POLICY "Staff can view all docs"
  ON public.result_documents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE POLICY "Staff can insert docs"
  ON public.result_documents FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE POLICY "Staff can update docs"
  ON public.result_documents FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE POLICY "Staff can delete docs"
  ON public.result_documents FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE TRIGGER update_result_documents_updated_at
  BEFORE UPDATE ON public.result_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
