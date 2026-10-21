ALTER TABLE public.news_translations ADD COLUMN IF NOT EXISTS source_snapshot jsonb;
UPDATE public.news_translations t SET source_snapshot=jsonb_build_object('title',n.title,'excerpt',n.excerpt,'content',n.content,'content_blocks',n.content_blocks) FROM public.news n WHERE n.id=t.news_id AND t.source_snapshot IS NULL;
CREATE TABLE public.news_translation_revisions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),news_id uuid NOT NULL,translation_id uuid NOT NULL,snapshot jsonb NOT NULL,archived_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.news_translation_revisions TO authenticated;
GRANT ALL ON public.news_translation_revisions TO service_role;
ALTER TABLE public.news_translation_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Administrators read translation revisions" ON public.news_translation_revisions FOR SELECT TO authenticated USING(public.account_is_active(auth.uid()) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Active translation account" ON public.news_translations AS RESTRICTIVE FOR ALL TO authenticated USING(public.account_is_active(auth.uid())) WITH CHECK(public.account_is_active(auth.uid()));
ALTER POLICY "Editors read translations of editable news" ON public.news_translations USING(public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.news n WHERE n.id=news_id AND public.can_access_own_editorial(n.created_by,n.country_code,n.section_id,'noticias','read')));
ALTER POLICY "Editors create translations of editable news" ON public.news_translations WITH CHECK(public.has_role(auth.uid(),'admin') OR (status IN ('draft','pending') AND approved_by IS NULL AND approved_at IS NULL AND EXISTS(SELECT 1 FROM public.news n WHERE n.id=news_id AND public.can_access_own_editorial(n.created_by,n.country_code,n.section_id,'noticias','create'))));
ALTER POLICY "Editors update translations of editable news" ON public.news_translations USING(public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.news n WHERE n.id=news_id AND public.can_access_own_editorial(n.created_by,n.country_code,n.section_id,'noticias','edit'))) WITH CHECK(public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.news n WHERE n.id=news_id AND public.can_access_own_editorial(n.created_by,n.country_code,n.section_id,'noticias','edit')));
ALTER POLICY "Public reads approved translations of published news" ON public.news_translations USING(status='approved' AND EXISTS(SELECT 1 FROM public.news n WHERE n.id=news_id AND n.published=true AND source_snapshot=jsonb_build_object('title',n.title,'excerpt',n.excerpt,'content',n.content,'content_blocks',n.content_blocks)));
CREATE OR REPLACE FUNCTION public.news_translations_guard_approval() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE source jsonb; content_changed boolean:=false; admin_ok boolean;
BEGIN
SELECT jsonb_build_object('title',n.title,'excerpt',n.excerpt,'content',n.content,'content_blocks',n.content_blocks) INTO source FROM public.news n WHERE n.id=NEW.news_id;
admin_ok:=auth.uid() IS NOT NULL AND public.account_is_active(auth.uid()) AND public.has_role(auth.uid(),'admin');
IF TG_OP='INSERT' THEN
IF (NEW.status='approved' OR NEW.approved_by IS NOT NULL OR NEW.approved_at IS NOT NULL) AND NOT admin_ok THEN RAISE EXCEPTION 'Solo un administrador activo puede aprobar traducciones' USING ERRCODE='42501'; END IF;
NEW.source_snapshot:=source;
ELSE
IF NEW.id IS DISTINCT FROM OLD.id OR NEW.news_id IS DISTINCT FROM OLD.news_id OR NEW.lang IS DISTINCT FROM OLD.lang OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'La identidad de la traducción no puede cambiar' USING ERRCODE='42501'; END IF;
content_changed:=(to_jsonb(NEW)-ARRAY['status','approved_by','approved_at','updated_at','translated_at','source_hash','source_snapshot']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','approved_by','approved_at','updated_at','translated_at','source_hash','source_snapshot']);
IF OLD.status='approved' AND (content_changed OR NEW.status IS DISTINCT FROM OLD.status OR NEW.source_snapshot IS DISTINCT FROM OLD.source_snapshot) THEN
INSERT INTO public.news_translation_revisions(news_id,translation_id,snapshot) VALUES(OLD.news_id,OLD.id,to_jsonb(OLD));
NEW.status:='pending'; NEW.approved_by:=NULL; NEW.approved_at:=NULL;
ELSE
IF ((NEW.status='approved' AND OLD.status IS DISTINCT FROM NEW.status) OR NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at) AND NOT admin_ok THEN RAISE EXCEPTION 'Solo un administrador activo puede aprobar traducciones' USING ERRCODE='42501'; END IF;
END IF;
IF NEW.source_snapshot IS DISTINCT FROM OLD.source_snapshot AND NEW.source_snapshot IS DISTINCT FROM source THEN RAISE EXCEPTION 'El original cambió; revisa la traducción' USING ERRCODE='23514'; END IF;
IF NEW.source_hash IS DISTINCT FROM OLD.source_hash AND NEW.source_hash IS NOT NULL THEN NEW.source_snapshot:=source; END IF;
END IF;
IF NEW.status='approved' THEN
IF NOT admin_ok THEN RAISE EXCEPTION 'Solo un administrador activo puede aprobar traducciones' USING ERRCODE='42501'; END IF;
IF NEW.source_snapshot IS DISTINCT FROM source OR NEW.source_hash IS NULL OR NEW.approved_by IS DISTINCT FROM auth.uid() OR NEW.approved_at IS NULL THEN RAISE EXCEPTION 'La aprobación requiere una traducción revisada del original actual' USING ERRCODE='23514'; END IF;
END IF;
RETURN NEW;
END $$;
DROP TRIGGER news_translations_guard_approval ON public.news_translations;
CREATE TRIGGER news_translations_guard_approval BEFORE INSERT OR UPDATE ON public.news_translations FOR EACH ROW EXECUTE FUNCTION public.news_translations_guard_approval();
CREATE FUNCTION public.news_translation_source_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF ROW(NEW.title,NEW.excerpt,NEW.content,NEW.content_blocks) IS DISTINCT FROM ROW(OLD.title,OLD.excerpt,OLD.content,OLD.content_blocks) THEN
UPDATE public.news_translations SET status=CASE WHEN status='approved' THEN 'pending' ELSE status END,approved_by=NULL,approved_at=NULL,source_hash=NULL WHERE news_id=NEW.id;
END IF;
RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.news_translation_source_changed() FROM PUBLIC;
CREATE TRIGGER news_translation_source_changed AFTER UPDATE OF title,excerpt,content,content_blocks ON public.news FOR EACH ROW EXECUTE FUNCTION public.news_translation_source_changed();