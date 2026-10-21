-- Security rollback: restore rules only; keep all translation content and archived revisions.
DROP TRIGGER IF EXISTS news_translation_source_changed ON public.news;
DROP POLICY IF EXISTS "Active translation account" ON public.news_translations;
ALTER POLICY "Editors create translations of editable news" ON public.news_translations WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR (EXISTS ( SELECT 1
   FROM news n
  WHERE ((n.id = news_translations.news_id) AND ((n.created_by = auth.uid()) OR can_edit_country(auth.uid(), n.country_code)))))));
ALTER POLICY "Editors read translations of editable news" ON public.news_translations USING ((has_role(auth.uid(), 'admin'::app_role) OR (EXISTS ( SELECT 1
   FROM news n
  WHERE ((n.id = news_translations.news_id) AND ((n.created_by = auth.uid()) OR can_edit_country(auth.uid(), n.country_code)))))));
ALTER POLICY "Editors update translations of editable news" ON public.news_translations USING ((has_role(auth.uid(), 'admin'::app_role) OR (EXISTS ( SELECT 1
   FROM news n
  WHERE ((n.id = news_translations.news_id) AND ((n.created_by = auth.uid()) OR can_edit_country(auth.uid(), n.country_code)))))));
ALTER POLICY "Only admins delete translations" ON public.news_translations USING (has_role(auth.uid(), 'admin'::app_role));
ALTER POLICY "Public reads approved translations of published news" ON public.news_translations USING (((status = 'approved'::text) AND (EXISTS ( SELECT 1
   FROM news n
  WHERE ((n.id = news_translations.news_id) AND (n.published = true))))));
CREATE OR REPLACE FUNCTION public.news_translations_guard_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'approved')
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Solo un administrador puede aprobar traducciones';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER news_translations_guard_approval ON public.news_translations;
CREATE TRIGGER news_translations_guard_approval BEFORE UPDATE ON public.news_translations FOR EACH ROW EXECUTE FUNCTION news_translations_guard_approval();